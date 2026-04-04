using Microsoft.Extensions.Logging;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

/// <summary>
/// Service for sending notifications via email or WhatsApp
/// </summary>
public interface INotificationService
{
    /// <summary>
    /// Send invitation via email or WhatsApp
    /// </summary>
    Task<bool> SendInvitationAsync(Invitation invitation, string invitationLink);

    /// <summary>
    /// Send email
    /// </summary>
    Task<bool> SendEmailAsync(string email, string subject, string htmlContent);

    /// <summary>
    /// Send WhatsApp message
    /// </summary>
    Task<bool> SendWhatsAppAsync(string phoneNumber, string message);
}

public class NotificationService : INotificationService
{
    private readonly ILogger<NotificationService> _logger;
    private readonly string _sendGridApiKey;
    private readonly string _sendGridFromEmail;
    private readonly string _twilioAccountSid;
    private readonly string _twilioAuthToken;
    private readonly string _twilioWhatsAppNumber;

    public NotificationService(ILogger<NotificationService> logger)
    {
        _logger = logger;
        _sendGridApiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY") ?? "";
        _sendGridFromEmail = Environment.GetEnvironmentVariable("SENDGRID_FROM_EMAIL") ?? "noreply@worldcup2026.com";
        _twilioAccountSid = Environment.GetEnvironmentVariable("TWILIO_ACCOUNT_SID") ?? "";
        _twilioAuthToken = Environment.GetEnvironmentVariable("TWILIO_AUTH_TOKEN") ?? "";
        _twilioWhatsAppNumber = Environment.GetEnvironmentVariable("TWILIO_WHATSAPP_NUMBER") ?? "";
    }

    public async Task<bool> SendInvitationAsync(Invitation invitation, string invitationLink)
    {
        try
        {
            var subject = "¡Estás invitado a WorldCup 2026!";
            var htmlContent = GenerateInvitationEmailHtml(invitation, invitationLink);

            if (invitation.NotificationChannel == "whatsapp" && !string.IsNullOrWhiteSpace(invitation.PhoneNumber))
            {
                var message = $"Hola {invitation.Email},\n\n" +
                    $"Has sido invitado a WorldCup 2026. Haz clic en el siguiente enlace para registrarte:\n\n" +
                    $"{invitationLink}\n\n" +
                    $"Este enlace expira en 28 horas.\n\n" +
                    $"Código de invitación: {invitation.InvitationCode}";

                return await SendWhatsAppAsync(invitation.PhoneNumber, message);
            }
            else
            {
                return await SendEmailAsync(invitation.Email, subject, htmlContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending invitation to {Email}", invitation.Email);
            return false;
        }
    }

    public async Task<bool> SendEmailAsync(string email, string subject, string htmlContent)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_sendGridApiKey))
            {
                _logger.LogWarning("SendGrid API key not configured, skipping email to {Email}", email);
                return false;
            }

            // Using SendGrid API
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _sendGridApiKey);

                var request = new
                {
                    personalizations = new[] {
                        new {
                            to = new[] { new { email = email } },
                            subject = subject
                        }
                    },
                    from = new { email = _sendGridFromEmail },
                    content = new[] {
                        new {
                            type = "text/html",
                            value = htmlContent
                        }
                    }
                };

                var json = System.Text.Json.JsonSerializer.Serialize(request);
                var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://api.sendgrid.com/v3/mail/send", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", email);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send email to {Email}: {StatusCode}", email, response.StatusCode);
                    return false;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", email);
            return false;
        }
    }

    public async Task<bool> SendWhatsAppAsync(string phoneNumber, string message)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_twilioAccountSid) || string.IsNullOrWhiteSpace(_twilioAuthToken))
            {
                _logger.LogWarning("Twilio credentials not configured, skipping WhatsApp to {PhoneNumber}", phoneNumber);
                return false;
            }

            // Using Twilio API
            using (var client = new HttpClient())
            {
                var auth = Convert.ToBase64String(
                    System.Text.Encoding.ASCII.GetBytes($"{_twilioAccountSid}:{_twilioAuthToken}"));
                client.DefaultRequestHeaders.Authorization =
                    new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", auth);

                var data = new Dictionary<string, string>
                {
                    { "From", $"whatsapp:{_twilioWhatsAppNumber}" },
                    { "To", $"whatsapp:{phoneNumber}" },
                    { "Body", message }
                };

                var content = new FormUrlEncodedContent(data);
                var response = await client.PostAsync(
                    $"https://api.twilio.com/2010-04-01/Accounts/{_twilioAccountSid}/Messages",
                    content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("WhatsApp sent successfully to {PhoneNumber}", phoneNumber);
                    return true;
                }
                else
                {
                    _logger.LogError("Failed to send WhatsApp to {PhoneNumber}: {StatusCode}",
                        phoneNumber, response.StatusCode);
                    return false;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending WhatsApp to {PhoneNumber}", phoneNumber);
            return false;
        }
    }

    private string GenerateInvitationEmailHtml(Invitation invitation, string invitationLink)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; border: 1px solid #ddd; }}
        .button {{ display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
        .footer {{ text-align: center; padding-top: 20px; font-size: 12px; color: #999; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>¡Bienvenido a WorldCup 2026!</h1>
        </div>
        <div class='content'>
            <p>Hola,</p>
            <p>Has sido invitado por un administrador a unirte a nuestra comunidad de predicciones del Mundial 2026.</p>
            {(string.IsNullOrWhiteSpace(invitation.CustomMessage) ? "" : $"<p><strong>Mensaje personalizado:</strong></p><p>{invitation.CustomMessage}</p>")}
            <p>Para completar tu registro, haz clic en el siguiente botón:</p>
            <p><a href='{invitationLink}' class='button'>Registrarse Ahora</a></p>
            <p>O copia y pega el siguiente enlace en tu navegador:</p>
            <p><code>{invitationLink}</code></p>
            <p><strong>Información importante:</strong></p>
            <ul>
                <li>Este enlace expira en <strong>28 horas</strong></li>
                <li>Código de invitación: <strong>{invitation.InvitationCode}</strong></li>
                <li>Creado el: <strong>{invitation.CreatedAt:dd/MM/yyyy HH:mm} UTC</strong></li>
            </ul>
            <p>Si tienes problemas para acceder, contacta a nuestro equipo de soporte.</p>
        </div>
        <div class='footer'>
            <p>&copy; 2026 WorldCup Predictions. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>";
    }
}
