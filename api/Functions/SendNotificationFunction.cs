using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;
using WorldCup.Api.Models;

namespace WorldCup.Api.Functions;

/// <summary>
/// Azure Function to send invitation via email or WhatsApp
/// </summary>
public class SendNotificationFunction
{
    private readonly IConfiguration _config;
    private readonly ILogger<SendNotificationFunction> _logger;

    public SendNotificationFunction(
        IConfiguration config,
        ILogger<SendNotificationFunction> logger)
    {
        _config = config;
        _logger = logger;
    }

    [Function("SendNotification")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "notifications/send")]
        HttpRequestData req)
    {
        _logger.LogInformation("SendNotification function called");

        try
        {
            var body = await req.ReadFromJsonAsync<SendNotificationRequest>();
            if (body == null)
            {
                _logger.LogWarning("Invalid request body");
                return req.CreateResponse(HttpStatusCode.BadRequest);
            }

            bool success = false;

            if (body.Channel == "email")
            {
                success = await SendEmailAsync(body.Email, body.Link);
            }
            else if (body.Channel == "whatsapp")
            {
                if (string.IsNullOrWhiteSpace(body.Phone))
                {
                    _logger.LogWarning("WhatsApp channel requires phone number");
                    return req.CreateResponse(HttpStatusCode.BadRequest);
                }

                success = await SendWhatsAppAsync(body.Phone, body.Link);
            }
            else
            {
                _logger.LogWarning("Unknown notification channel: {Channel}", body.Channel);
                return req.CreateResponse(HttpStatusCode.BadRequest);
            }

            if (!success)
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteAsJsonAsync(new { error = "Failed to send notification" });
                return errorResponse;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = ex.Message });
            return errorResponse;
        }
    }

    /// <summary>
    /// Send email via SendGrid
    /// </summary>
    private async Task<bool> SendEmailAsync(string email, string link)
    {
        try
        {
            var apiKey = _config["SendGrid:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("SendGrid API key not configured");
                return false;
            }

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(_config["SendGrid:From"] ?? "noreply@worldcup2026.com", "WorldCup 2026");
            var to = new EmailAddress(email);
            var subject = "Te han invitado a registrarte en WorldCup 2026";
            var plainTextContent = $"Haz clic en el siguiente enlace para completar tu registro:\n{link}\n\nEste enlace expira en 24 horas.";
            var htmlContent = $@"
<html>
<body>
    <h2>¡Bienvenido a WorldCup 2026!</h2>
    <p>Has sido invitado a unirte a nuestra comunidad de predicciones del Mundial.</p>
    <p>Haz clic en el siguiente botón para completar tu registro:</p>
    <p><a href='{link}' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Registrarse Ahora</a></p>
    <p>O copia y pega este enlace en tu navegador:</p>
    <p><code>{link}</code></p>
    <p><strong>Importante:</strong> Este enlace expira en <strong>24 horas</strong>.</p>
    <p>Si no solicitaste esta invitación, puedes ignorar este correo.</p>
</body>
</html>";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent, htmlContent);
            var response = await client.SendEmailAsync(msg);

            _logger.LogInformation("Email sent to {Email} with status: {StatusCode}", email, response.StatusCode);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", email);
            return false;
        }
    }

    /// <summary>
    /// Send WhatsApp message via Twilio
    /// </summary>
    private async Task<bool> SendWhatsAppAsync(string phone, string link)
    {
        try
        {
            var accountSid = _config["Twilio:AccountSid"];
            var authToken = _config["Twilio:AuthToken"];
            var whatsAppNumber = _config["Twilio:WhatsAppNumber"];

            if (string.IsNullOrWhiteSpace(accountSid) || string.IsNullOrWhiteSpace(authToken))
            {
                _logger.LogWarning("Twilio credentials not configured");
                return false;
            }

            TwilioClient.Init(accountSid, authToken);

            var message = $"¡Hola! Fuiste invitado a registrarte en WorldCup 2026.\n\n" +
                         $"Usa este enlace (válido 24 horas):\n{link}";

            var result = await MessageResource.CreateAsync(
                from: new PhoneNumber($"whatsapp:{whatsAppNumber}"),
                to: new PhoneNumber($"whatsapp:{phone}"),
                body: message
            );

            _logger.LogInformation("WhatsApp sent to {Phone} with SID: {Sid}", phone, result.Sid);
            return !string.IsNullOrEmpty(result.Sid);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WhatsApp to {Phone}", phone);
            return false;
        }
    }
}
