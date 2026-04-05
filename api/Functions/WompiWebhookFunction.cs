using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Webhook para procesar eventos de Wompi
/// Activará usuarios cuando el pago sea aprobado
/// </summary>
public class WompiWebhookFunction
{
    private readonly AppDbContext _db;
    private readonly IPaymentRepository _paymentRepository;
    private readonly EmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<WompiWebhookFunction> _logger;

    public WompiWebhookFunction(
        AppDbContext db,
        IPaymentRepository paymentRepository,
        EmailService emailService,
        IConfiguration config,
        ILogger<WompiWebhookFunction> logger)
    {
        _db = db;
        _paymentRepository = paymentRepository;
        _emailService = emailService;
        _config = config;
        _logger = logger;
    }

    [Function("WompiWebhook")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "payments/wompi-webhook")]
        HttpRequestData req)
    {
        _logger.LogInformation("WompiWebhook received");

        try
        {
            // 1. Leer body como string (necesario para validar checksum)
            var body = await new StreamReader(req.Body).ReadToEndAsync();
            _logger.LogDebug("Webhook body: {Body}", body);

            WompiWebhookEvent evt;
            try
            {
                evt = JsonSerializer.Deserialize<WompiWebhookEvent>(body,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? throw new InvalidOperationException("Failed to deserialize event");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize webhook");
                return req.CreateResponse(HttpStatusCode.BadRequest);
            }

            // 2. Validar checksum (seguridad crítica)
            if (!ValidateChecksum(evt, body))
            {
                _logger.LogWarning("Wompi webhook: checksum inválido");
                return req.CreateResponse(HttpStatusCode.Unauthorized);
            }

            // 3. Solo procesar transacciones actualizadas
            if (evt.Event != "transaction.updated")
            {
                _logger.LogInformation("Evento ignorado (no es transaction.updated): {Event}", evt.Event);
                return req.CreateResponse(HttpStatusCode.OK);
            }

            var tx = evt.Data?.Transaction;
            if (tx == null)
            {
                _logger.LogWarning("Transaction es null");
                return req.CreateResponse(HttpStatusCode.OK);
            }

            // 4. Guardar el pago (SIEMPRE, independientemente del estado)
            await SavePaymentAsync(tx, evt);

            // 5. Solo activar usuario si el pago fue APROBADO
            if (tx.Status == "APPROVED")
            {
                await ActivateUserAsync(tx);
            }
            else
            {
                _logger.LogInformation("Wompi webhook: transacción {Id} con estado {Status} (no se activa usuario)",
                    tx.Id, tx.Status);
            }

            // 6. Retornar 200 OK (Wompi necesita esto para no reintentar)
            return req.CreateResponse(HttpStatusCode.OK);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook Wompi");
            // Retornar 200 de todas formas para que Wompi no reintente infinitamente
            return req.CreateResponse(HttpStatusCode.OK);
        }
    }

    /// <summary>
    /// Valida la firma SHA256 del evento Wompi
    /// Esto previene que cualquiera active usuarios falsos
    /// </summary>
    private bool ValidateChecksum(WompiWebhookEvent evt, string rawBody)
    {
        try
        {
            var eventsSecret = _config["Wompi:EventsSecret"]
                ?? throw new InvalidOperationException("Wompi:EventsSecret not configured");

            var tx = evt.Data?.Transaction;
            if (tx == null) return false;

            var props = evt.Signature.Properties;
            if (props == null || props.Count == 0) return false;

            // Construir cadena según el orden de propiedades especificado por Wompi
            var values = props.Select(prop => prop switch
            {
                "transaction.id" => tx.Id,
                "transaction.status" => tx.Status,
                "transaction.amount_in_cents" => tx.AmountInCents.ToString(),
                "transaction.currency" => tx.Currency,
                "transaction.reference" => tx.Reference,
                _ => string.Empty
            });

            var concatenated = string.Concat(values) + evt.Timestamp + eventsSecret;
            var hashCalculated = ComputeSHA256(concatenated).ToUpper();

            var checksumReceived = evt.Signature.Checksum.ToUpper();

            _logger.LogDebug(
                "Checksum validation - Calculated: {Calculated}, Received: {Received}",
                hashCalculated, checksumReceived);

            return hashCalculated == checksumReceived;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validando checksum");
            return false;
        }
    }

    /// <summary>
    /// Guarda el registro de pago en BD (SIEMPRE, para auditoría)
    /// </summary>
    private async Task SavePaymentAsync(WompiTransaction tx, WompiWebhookEvent evt)
    {
        // Evitar duplicados si Wompi reenvía el mismo evento
        if (await _paymentRepository.ExistsByWompiTransactionIdAsync(tx.Id))
        {
            _logger.LogInformation("Pago {WompiId} ya existe, ignorando duplicado", tx.Id);
            return;
        }

        var payment = new PaymentEntity
        {
            Id = Guid.NewGuid().ToString(),
            UserEmail = tx.CustomerEmail,
            WompiTransactionId = tx.Id,
            WompiReference = tx.Reference,
            AmountInCents = tx.AmountInCents,
            AmountCOP = tx.AmountInCents / 100m,
            Currency = tx.Currency,
            PaymentMethodType = tx.PaymentMethodType,
            Status = tx.Status,
            WompiStatus = tx.Status,
            Environment = evt.Environment,
            WompiEventTimestamp = evt.Timestamp,
            WebhookReceivedAt = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow,
            CardBrand = tx.PaymentMethod?.Brand,
            CardLastFour = tx.PaymentMethod?.LastFour,
            IsRefunded = false
        };

        await _paymentRepository.CreateAsync(payment);
        _logger.LogInformation("Pago guardado: {WompiId}, Status: {Status}", tx.Id, tx.Status);
    }

    /// <summary>
    /// Activa el usuario cuando el pago es aprobado
    /// </summary>
    private async Task ActivateUserAsync(WompiTransaction tx)
    {
        try
        {
            // Extraer userId de la referencia (formato: SUB-{userId8}-{timestamp})
            var parts = tx.Reference?.Split('-');
            if (parts == null || parts.Length < 2)
            {
                _logger.LogWarning("Formato de referencia inválido: {Reference}", tx.Reference);
                return;
            }

            var userId8 = parts[1];

            // Buscar usuario por userId que comience con esos 8 caracteres y esté en pending_payment
            var user = await _db.Users
                .FirstOrDefaultAsync(u => u.Id.StartsWith(userId8) && u.Status == "pending_payment");

            if (user == null)
            {
                _logger.LogWarning("Usuario no encontrado para referencia: {Reference}", tx.Reference);
                return;
            }

            // Activar usuario
            user.Status = "active";
            user.IsEmailVerified = true;
            await _db.SaveChangesAsync();

            _logger.LogInformation("Usuario activado: {Email}, Pago Wompi: {TxId}", user.Email, tx.Id);

            // Enviar email de bienvenida
            try
            {
                await _emailService.SendWelcomeEmailAsync(user.Email, user.DisplayName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enviando email de bienvenida a {Email}", user.Email);
                // No fallar si el email no se envía, el usuario ya está activado
            }

            // Actualizar PaymentEntity con el userId
            var payment = await _paymentRepository.GetByWompiTransactionIdAsync(tx.Id);
            if (payment != null)
            {
                payment.UserId = user.Id;
                await _paymentRepository.UpdateAsync(payment);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activando usuario para transacción {TxId}", tx.Id);
        }
    }

    private static string ComputeSHA256(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLower();
    }
}
