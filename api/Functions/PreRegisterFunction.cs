using System.Net;
using System.Security.Cryptography;
using System.Text;
using static BCrypt.Net.BCrypt;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Models;

namespace WorldCup.Api.Functions;

/// <summary>
/// Azure Function para pre-registro de usuario
/// Crea usuario con status="pending_payment" y retorna checkout URL de Wompi
/// </summary>
public class PreRegisterFunction
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<PreRegisterFunction> _logger;

    public PreRegisterFunction(
        AppDbContext db,
        IConfiguration config,
        ILogger<PreRegisterFunction> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    [Function("PreRegister")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/pre-register")]
        HttpRequestData req)
    {
        _logger.LogInformation("PreRegister function called");

        try
        {
            // 1. Leer body
            var body = await req.ReadFromJsonAsync<PreRegisterRequest>();
            if (body == null)
                return ErrorResponse(req, "Invalid request body", HttpStatusCode.BadRequest);

            // 2. Validar input
            if (string.IsNullOrWhiteSpace(body.Email))
                return ErrorResponse(req, "El email es requerido", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(body.Name) || body.Name.Trim().Length < 2)
                return ErrorResponse(req, "El nombre debe tener mínimo 2 caracteres", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(body.Password) || body.Password.Length < 8)
                return ErrorResponse(req, "La contraseña debe tener mínimo 8 caracteres", HttpStatusCode.BadRequest);

            var emailLower = body.Email.Trim().ToLower();

            // 3. Verificar que email no existe
            var existing = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == emailLower);
            if (existing != null)
                return ErrorResponse(req, "El email ya está registrado", HttpStatusCode.BadRequest);

            // 4. Crear usuario con status=pending_payment
            var userId = Guid.NewGuid().ToString();
            var passwordHash = HashPassword(body.Password, 12);

            var user = new UserEntity
            {
                Id = userId,
                Email = emailLower,
                DisplayName = body.Name.Trim(),
                PasswordHash = passwordHash,
                Status = "pending_payment",
                Role = "user",
                IsEmailVerified = false,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Usuario creado en pending_payment: {Email}", emailLower);

            // 5. Generar referencia única para Wompi
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var reference = $"SUB-{userId[..8]}-{timestamp}";

            // 6. Calcular monto (ajustar según tu precio de suscripción)
            var amountInCents = 5000000L; // $50.000 COP

            // 7. Generar firma SHA256 para integridad
            var integritySecret = _config["Wompi:IntegritySecret"]
                ?? throw new InvalidOperationException("Wompi:IntegritySecret not configured");

            var integrityData = $"{reference}{amountInCents}COP{integritySecret}";
            var integrity = ComputeSHA256(integrityData);

            // 8. Construir URL de checkout Wompi
            var publicKey = _config["Wompi:PublicKey"]
                ?? throw new InvalidOperationException("Wompi:PublicKey not configured");

            var redirectUrl = _config["App:FrontendUrl"] ?? "http://localhost:3000";
            var paymentResultUrl = $"{redirectUrl}/pago-resultado";

            var checkoutUrl = BuildCheckoutUrl(publicKey, reference, amountInCents, integrity, paymentResultUrl, emailLower, body.Name);

            // 9. Responder exitosamente
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new PreRegisterResponse
            {
                CheckoutUrl = checkoutUrl,
                UserId = userId,
                Message = "Usuario creado. Completa el pago para activar tu cuenta."
            });

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en PreRegister");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private static string ComputeSHA256(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLower();
    }

    private static string BuildCheckoutUrl(string publicKey, string reference, long amountInCents,
        string integrity, string redirectUrl, string email, string name)
    {
        var baseUrl = "https://checkout.wompi.co/p/";

        var qs = new StringBuilder();
        qs.Append($"?public-key={publicKey}");
        qs.Append("&currency=COP");
        qs.Append($"&amount-in-cents={amountInCents}");
        qs.Append($"&reference={Uri.EscapeDataString(reference)}");
        qs.Append($"&signature:integrity={integrity}");
        qs.Append($"&redirect-url={Uri.EscapeDataString(redirectUrl)}");
        qs.Append($"&customer-data:email={Uri.EscapeDataString(email)}");
        qs.Append($"&customer-data:full-name={Uri.EscapeDataString(name)}");

        return baseUrl + qs.ToString();
    }

    private static HttpResponseData ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
