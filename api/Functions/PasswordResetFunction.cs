using System.Net;
using System.Security.Cryptography;
using static BCrypt.Net.BCrypt;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class PasswordResetFunction
{
    private const int TokenExpiryMinutes = 30;

    private readonly IPasswordResetTokenRepository _tokenRepo;
    private readonly IUserRepository _userRepo;
    private readonly EmailService _emailService;
    private readonly JwtService _jwtService;
    private readonly IConfiguration _config;
    private readonly ILogger<PasswordResetFunction> _logger;

    public PasswordResetFunction(
        IPasswordResetTokenRepository tokenRepo,
        IUserRepository userRepo,
        EmailService emailService,
        JwtService jwtService,
        IConfiguration config,
        ILogger<PasswordResetFunction> logger)
    {
        _tokenRepo = tokenRepo;
        _userRepo = userRepo;
        _emailService = emailService;
        _jwtService = jwtService;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Admin genera un enlace de reset para el usuario — envía email y devuelve el link.
    /// </summary>
    [Function("AdminSendResetLink")]
    public async Task<HttpResponseData> SendResetLink(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/users/{userId}/send-reset-link")]
        HttpRequestData req,
        string userId)
    {
        _logger.LogInformation("AdminSendResetLink called for userId={UserId}", userId);

        try
        {
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            if (string.IsNullOrEmpty(token))
                return Error(req, "No autenticado", HttpStatusCode.Unauthorized);

            var principal = _jwtService.ValidateToken(token);
            if (_jwtService.ExtractRole(principal) != "admin")
                return Error(req, "Acceso denegado", HttpStatusCode.Forbidden);

            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return Error(req, "Usuario no encontrado", HttpStatusCode.NotFound);

            // Invalidar tokens anteriores del mismo usuario
            await _tokenRepo.InvalidatePreviousTokensAsync(userId);

            // Generar token seguro
            var rawToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            var resetToken = new PasswordResetTokenEntity
            {
                UserId = userId,
                Token = rawToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(TokenExpiryMinutes),
            };
            await _tokenRepo.CreateAsync(resetToken);

            var frontendUrl = _config["App:FrontendUrl"] ?? "https://francachelamxsubachoque.site";
            var resetLink = $"{frontendUrl}/reset-password?token={rawToken}";

            // Enviar email
            await _emailService.SendPasswordResetEmailAsync(user.Email, user.DisplayName, resetLink);

            _logger.LogInformation("Reset link sent to {Email}, expires in {Min} min", user.Email, TokenExpiryMinutes);

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteAsJsonAsync(new
            {
                success = true,
                message = $"Enlace enviado a {user.Email}",
                link = resetLink,
                expiresInMinutes = TokenExpiryMinutes,
            });
            return ok;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en AdminSendResetLink");
            return Error(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    /// <summary>
    /// El usuario usa el token del enlace para establecer su nueva contraseña.
    /// Ruta pública (sin auth).
    /// </summary>
    [Function("ResetPasswordWithToken")]
    public async Task<HttpResponseData> ResetPasswordWithToken(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/reset-password-with-token")]
        HttpRequestData req)
    {
        _logger.LogInformation("ResetPasswordWithToken called");

        try
        {
            var body = await req.ReadFromJsonAsync<ResetWithTokenRequest>();
            if (string.IsNullOrWhiteSpace(body?.Token) || string.IsNullOrWhiteSpace(body.NewPassword))
                return Error(req, "token y newPassword son requeridos", HttpStatusCode.BadRequest);

            if (body.NewPassword.Length < 8)
                return Error(req, "La contraseña debe tener al menos 8 caracteres", HttpStatusCode.BadRequest);

            var resetToken = await _tokenRepo.GetByTokenAsync(body.Token);
            if (resetToken == null || !resetToken.IsValid)
            {
                var msg = resetToken == null ? "Enlace inválido" : "Este enlace ya fue usado o ha expirado";
                return Error(req, msg, HttpStatusCode.BadRequest);
            }

            var user = await _userRepo.GetByIdAsync(resetToken.UserId);
            if (user == null)
                return Error(req, "Usuario no encontrado", HttpStatusCode.NotFound);

            user.PasswordHash = HashPassword(body.NewPassword, 12);
            await _userRepo.UpdateAsync(user);
            await _tokenRepo.MarkUsedAsync(resetToken);

            _logger.LogInformation("Password reset successful for userId={UserId}", user.Id);

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteAsJsonAsync(new { success = true, message = "Contraseña actualizada. Ya puedes iniciar sesión." });
            return ok;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en ResetPasswordWithToken");
            return Error(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private HttpResponseData Error(HttpRequestData req, string message, HttpStatusCode status)
    {
        var response = req.CreateResponse(status);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }

    private record ResetWithTokenRequest(string Token, string NewPassword);
}
