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
    /// Envía email de bienvenida cuando el usuario completa el registro
    /// </summary>
    public async Task SendWelcomeEmailAsync(string email, string displayName)
    {
        var loginUrl = _config["App:FrontendUrl"] ?? "https://francachelamxsubachoque.site";

        var html = $@"<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
  <meta name=""x-apple-disable-message-reformatting"">
  <title>Bienvenido a Francachela</title>
</head>
<body style=""margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"">

  <!-- Preheader invisible -->
  <span style=""display:none;max-height:0;overflow:hidden;"">Tu cuenta en Francachela ya está lista ⚽</span>

  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"" style=""background-color:#f4f4f5;"">
    <tr>
      <td align=""center"" style=""padding:32px 16px;"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"" style=""max-width:520px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);"">

          <!-- Header -->
          <tr>
            <td style=""background-color:#0f1923;padding:28px 32px;text-align:center;"">
              <p style=""margin:0;font-size:22px;font-weight:700;color:#1D9E75;letter-spacing:1px;"">FRANCACHELA</p>
              <p style=""margin:6px 0 0;font-size:12px;color:#8899a6;letter-spacing:2px;text-transform:uppercase;"">Polla Mundialista 2026</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style=""padding:36px 32px 28px;"">
              <p style=""margin:0 0 16px;font-size:20px;font-weight:600;color:#0f1923;"">Hola, {displayName} 👋</p>
              <p style=""margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;"">
                Tu cuenta está activa. Ya puedes ingresar y empezar a hacer tus predicciones para el <strong>Mundial 2026</strong>.
              </p>

              <table cellpadding=""0"" cellspacing=""0"" role=""presentation"" style=""margin:24px 0;"">
                <tr>
                  <td style=""background-color:#1D9E75;border-radius:6px;"">
                    <a href=""{loginUrl}/login"" style=""display:inline-block;padding:13px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;"">Iniciar sesión</a>
                  </td>
                </tr>
              </table>

              <p style=""margin:0 0 8px;font-size:14px;color:#666;"">Con tu cuenta puedes:</p>
              <ul style=""margin:0 0 24px;padding-left:20px;font-size:14px;color:#555;line-height:1.8;"">
                <li>Predecir resultados de los partidos</li>
                <li>Escalar en el ranking de posiciones</li>
                <li>Participar en rifas especiales</li>
              </ul>

              <p style=""margin:0;font-size:13px;color:#999;"">
                Tu correo de acceso es: <strong style=""color:#555;"">{email}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""background-color:#f9f9f9;padding:20px 32px;border-top:1px solid #eee;"">
              <p style=""margin:0;font-size:12px;color:#aaa;line-height:1.6;"">
                Recibiste este correo porque te registraste en Francachela.<br>
                Si no reconoces este registro, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        var text = $@"Hola {displayName},

Tu cuenta en Francachela ya está activa.

Ingresa aquí: {loginUrl}/login

Con tu cuenta puedes predecir resultados, subir en el ranking y participar en rifas del Mundial 2026.

Tu correo de acceso: {email}

---
Recibiste este correo porque te registraste en Francachela.
Si no reconoces este registro, ignora este mensaje.";

        await SendEmailAsync(
            to: email,
            subject: $"Bienvenido a Francachela, {displayName}",
            html: html,
            text: text
        );
    }

    /// <summary>
    /// Envía email de invitación para completar el registro
    /// </summary>
    public async Task SendInvitationEmailAsync(string email, string invitationLink, string adminName)
    {
        var html = $@"<!DOCTYPE html>
<html lang=""es"">
<head>
  <meta charset=""utf-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1"">
  <meta name=""x-apple-disable-message-reformatting"">
  <title>Invitación a Francachela</title>
</head>
<body style=""margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"">

  <!-- Preheader invisible -->
  <span style=""display:none;max-height:0;overflow:hidden;"">Tienes una invitación para la Polla Mundialista Francachela 2026 ⚽</span>

  <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"" style=""background-color:#f4f4f5;"">
    <tr>
      <td align=""center"" style=""padding:32px 16px;"">
        <table width=""100%"" cellpadding=""0"" cellspacing=""0"" role=""presentation"" style=""max-width:520px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);"">

          <!-- Header -->
          <tr>
            <td style=""background-color:#0f1923;padding:28px 32px;text-align:center;"">
              <p style=""margin:0;font-size:22px;font-weight:700;color:#1D9E75;letter-spacing:1px;"">FRANCACHELA</p>
              <p style=""margin:6px 0 0;font-size:12px;color:#8899a6;letter-spacing:2px;text-transform:uppercase;"">Polla Mundialista 2026</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style=""padding:36px 32px 28px;"">
              <p style=""margin:0 0 16px;font-size:20px;font-weight:600;color:#0f1923;"">Tienes una invitación ⚽</p>
              <p style=""margin:0 0 20px;font-size:15px;color:#444;line-height:1.6;"">
                {adminName} te invitó a participar en la <strong>Polla Mundialista Francachela 2026</strong>.
                Completa tu registro para empezar a predecir los partidos del Mundial.
              </p>

              <table cellpadding=""0"" cellspacing=""0"" role=""presentation"" style=""margin:24px 0;"">
                <tr>
                  <td style=""background-color:#1D9E75;border-radius:6px;"">
                    <a href=""{invitationLink}"" style=""display:inline-block;padding:13px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;"">Completar registro</a>
                  </td>
                </tr>
              </table>

              <p style=""margin:0 0 8px;font-size:13px;color:#888;"">
                El enlace es válido por <strong>24 horas</strong>. Si no puedes dar clic en el botón, copia este enlace:
              </p>
              <p style=""margin:0 0 24px;font-size:12px;color:#999;word-break:break-all;background:#f5f5f5;padding:10px 12px;border-radius:4px;"">
                {invitationLink}
              </p>

              <p style=""margin:0 0 8px;font-size:14px;color:#666;"">Al registrarte podrás:</p>
              <ul style=""margin:0;padding-left:20px;font-size:14px;color:#555;line-height:1.8;"">
                <li>Predecir los resultados de los partidos del Mundial</li>
                <li>Competir en el ranking con otros participantes</li>
                <li>Participar en rifas especiales</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style=""background-color:#f9f9f9;padding:20px 32px;border-top:1px solid #eee;"">
              <p style=""margin:0;font-size:12px;color:#aaa;line-height:1.6;"">
                Recibiste este correo porque alguien te envió una invitación a Francachela.<br>
                Si no esperabas esta invitación, puedes ignorar este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>";

        var text = $@"Tienes una invitación para Francachela

{adminName} te invitó a participar en la Polla Mundialista Francachela 2026.

Completa tu registro aquí (válido por 24 horas):
{invitationLink}

Al registrarte podrás predecir partidos del Mundial, competir en el ranking y participar en rifas.

---
Recibiste este correo porque alguien te envió una invitación a Francachela.
Si no esperabas esta invitación, ignora este mensaje.";

        await SendEmailAsync(
            to: email,
            subject: $"Invitación para unirte a Francachela — Mundial 2026",
            html: html,
            text: text
        );
    }

    /// <summary>
    /// Método central de envío — incluye html + text para mejor deliverabilidad
    /// </summary>
    private async Task SendEmailAsync(string to, string subject, string html, string text)
    {
        try
        {
            var apiKey = _config["Resend:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Resend:ApiKey no configurado. Email no enviado a {To}", to);
                return;
            }

            var request = new
            {
                from = "Francachela <hola@francachelamxsubachoque.site>",
                to,
                subject,
                html,
                text   // Versión texto plano — mejora deliverabilidad
            };

            var json = System.Text.Json.JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Clear();
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email enviado a {To} | Asunto: {Subject}", to, subject);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error enviando email a {To}: {Status} — {Error}", to, response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando email a {To}", to);
        }
    }
}
