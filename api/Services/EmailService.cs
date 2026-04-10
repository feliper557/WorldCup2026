using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WorldCup.Api.Services;

/// <summary>
/// Servicio para enviar emails usando Resend (resend.com)
/// Resend ofrece 3.000 emails/mes gratis
/// </summary>
public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly HttpClient _httpClient;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, HttpClient httpClient)
    {
        _config = config;
        _logger = logger;
        _httpClient = httpClient;
    }

    /// <summary>
    /// Envía email de bienvenida cuando el usuario es activado vía pago
    /// </summary>
    public async Task SendWelcomeEmailAsync(string email, string displayName)
    {
        try
        {
            var apiKey = _config["Resend:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Resend:ApiKey no configurado. Email de bienvenida no se envió.");
                return;
            }

            var loginUrl = _config["App:FrontendUrl"] ?? "http://localhost:3000";

            var emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }}
        .container {{ max-width: 480px; margin: 0 auto; padding: 32px; }}
        .header {{ color: #1D9E75; margin-bottom: 16px; }}
        .button {{ display: inline-block; background: #1D9E75; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }}
        .footer {{ color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; }}
        .footnote {{ color: #aaa; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <h2 class='header'>¡Hola {displayName}!</h2>

        <p>Tu pago fue confirmado y tu cuenta en <strong>Francachela</strong> ya está activa.</p>

        <p>Ahora puedes:</p>
        <ul>
            <li>Hacer predicciones de los partidos</li>
            <li>Subir en el ranking de posiciones</li>
            <li>Participar en rifas especiales</li>
            <li>Competir con otros participantes</li>
        </ul>

        <p>Haz clic en el botón para ingresar a la plataforma:</p>

        <a href='{loginUrl}/login' class='button'>Iniciar Sesión</a>

        <p style='color: #888; font-size: 13px;'>
            O copia este link: <br>
            <code>{loginUrl}/login</code>
        </p>

        <p style='margin-top: 24px;'>
            Tus credenciales de inicio de sesión son:
        </p>
        <ul style='color: #666;'>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Contraseña:</strong> La que ingresaste durante el registro</li>
        </ul>

        <div class='footer'>
            <p>¡Que disfrutes el Mundial 2026! 🌎⚽</p>
            <p class='footnote'>Si no creaste esta cuenta, por favor ignora este correo.</p>
        </div>
    </div>
</body>
</html>";

            // Llamar a API de Resend
            var request = new
            {
                from = "Francachela <noreply@francachelamxsubachoque.site>",
                to = email,
                subject = "¡Tu cuenta en Francachela está activa!",
                html = emailBody
            };

            var json = System.Text.Json.JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email de bienvenida enviado a {Email}", email);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error enviando email a {Email}: {Status} - {Error}",
                    email, response.StatusCode, errorContent);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando email a {Email}", email);
        }
    }

    /// <summary>
    /// Envía email de confirmación de invitación
    /// </summary>
    public async Task SendInvitationEmailAsync(string email, string invitationLink, string adminName)
    {
        try
        {
            var apiKey = _config["Resend:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Resend:ApiKey no configurado. Email de invitación no se envió.");
                return;
            }

            var emailBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }}
        .container {{ max-width: 480px; margin: 0 auto; padding: 32px; }}
        .header {{ color: #1D9E75; margin-bottom: 16px; }}
        .button {{ display: inline-block; background: #1D9E75; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }}
        .footer {{ color: #888; font-size: 13px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class='container'>
        <h2 class='header'>¡Estás invitado a Francachela!</h2>

        <p>{adminName} te invitó a participar en la <strong>Polla Mundialista Francachela 2026</strong>.</p>

        <p>Este enlace es válido por <strong>24 horas</strong>. Haz clic para completar tu registro:</p>

        <a href='{invitationLink}' class='button'>Completar Registro</a>

        <p style='color: #888; font-size: 13px;'>
            O copia este link: <br>
            <code style='word-break: break-all;'>{invitationLink}</code>
        </p>

        <p>Una vez registrado, podrás:</p>
        <ul>
            <li>Hacer predicciones de los partidos del Mundial</li>
            <li>Competir en el ranking</li>
            <li>Participar en rifas</li>
        </ul>

        <div class='footer'>
            <p>¡Que te diviertas en el Mundial! ⚽</p>
        </div>
    </div>
</body>
</html>";

            var request = new
            {
                from = "Francachela <noreply@francachelamxsubachoque.site>",
                to = email,
                subject = "¡Estás invitado a Francachela!",
                html = emailBody
            };

            var json = System.Text.Json.JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email de invitación enviado a {Email}", email);
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error enviando invitación a {Email}: {Status}",
                    email, response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando email de invitación a {Email}", email);
        }
    }
}
