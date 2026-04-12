using System.Net;
using BCrypt.Net;
using static BCrypt.Net.BCrypt;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class UpdateProfileFunction
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UpdateProfileFunction> _logger;
    private readonly JwtService _jwtService;

    public UpdateProfileFunction(
        IUserRepository userRepository,
        ILogger<UpdateProfileFunction> logger,
        JwtService jwtService)
    {
        _userRepository = userRepository;
        _logger = logger;
        _jwtService = jwtService;
    }

    [Function("UpdateProfile")]
    public async Task<HttpResponseData> UpdateProfile(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "auth/profile")]
        HttpRequestData req)
    {
        try
        {
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            if (string.IsNullOrEmpty(token))
                return await ErrorResponse(req, "Token requerido", HttpStatusCode.Unauthorized);

            var principal = _jwtService.ValidateToken(token);
            if (principal == null)
                return await ErrorResponse(req, "Token inválido o expirado", HttpStatusCode.Unauthorized);

            var userId = _jwtService.ExtractUserId(principal);
            var user = await _userRepository.GetByIdAsync(userId!);
            if (user == null)
                return await ErrorResponse(req, "Usuario no encontrado", HttpStatusCode.NotFound);

            var body = await req.ReadFromJsonAsync<UpdateProfileRequest>();
            if (body == null)
                return await ErrorResponse(req, "Body inválido", HttpStatusCode.BadRequest);

            // Actualizar sólo los campos permitidos (email no se puede cambiar)
            if (!string.IsNullOrWhiteSpace(body.DisplayName))
                user.DisplayName = body.DisplayName.Trim();
            if (!string.IsNullOrWhiteSpace(body.FirstName))
                user.FirstName = body.FirstName.Trim();
            if (!string.IsNullOrWhiteSpace(body.LastName))
                user.LastName = body.LastName.Trim();
            if (body.PhoneNumber != null)
                user.PhoneNumber = body.PhoneNumber.Trim();

            await _userRepository.UpdateAsync(user);
            _logger.LogInformation("Profile updated for user {UserId}", userId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new UserProfileResponse(
                Id: user.Id,
                Email: user.Email,
                DisplayName: user.DisplayName,
                Role: user.Role,
                PhoneNumber: user.PhoneNumber,
                TotalPoints: user.TotalPoints,
                TotalPredictions: user.TotalPredictions,
                CorrectPredictions: user.CorrectPredictions,
                AccuracyPercentage: user.AccuracyPercentage,
                LeaderboardRank: user.LeaderboardRank
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile");
            return await ErrorResponse(req, "Error actualizando perfil", HttpStatusCode.InternalServerError);
        }
    }

    [Function("ChangePassword")]
    public async Task<HttpResponseData> ChangePassword(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/change-password")]
        HttpRequestData req)
    {
        try
        {
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            if (string.IsNullOrEmpty(token))
                return await ErrorResponse(req, "Token requerido", HttpStatusCode.Unauthorized);

            var principal = _jwtService.ValidateToken(token);
            if (principal == null)
                return await ErrorResponse(req, "Token inválido o expirado", HttpStatusCode.Unauthorized);

            var userId = _jwtService.ExtractUserId(principal);
            var user = await _userRepository.GetByIdAsync(userId!);
            if (user == null)
                return await ErrorResponse(req, "Usuario no encontrado", HttpStatusCode.NotFound);

            var body = await req.ReadFromJsonAsync<ChangePasswordRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.CurrentPassword) || string.IsNullOrWhiteSpace(body.NewPassword))
                return await ErrorResponse(req, "Contraseña actual y nueva son requeridas", HttpStatusCode.BadRequest);

            if (body.NewPassword.Length < 8)
                return await ErrorResponse(req, "La nueva contraseña debe tener al menos 8 caracteres", HttpStatusCode.BadRequest);

            // Verificar contraseña actual
            if (!Verify(body.CurrentPassword, user.PasswordHash))
                return await ErrorResponse(req, "La contraseña actual es incorrecta", HttpStatusCode.BadRequest);

            // Hashear y guardar la nueva contraseña
            user.PasswordHash = HashPassword(body.NewPassword);
            await _userRepository.UpdateAsync(user);
            _logger.LogInformation("Password changed for user {UserId}", userId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true, message = "Contraseña actualizada correctamente" });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return await ErrorResponse(req, "Error cambiando contraseña", HttpStatusCode.InternalServerError);
        }
    }

    private static async Task<HttpResponseData> ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        await response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}

public record UpdateProfileRequest(
    string? DisplayName,
    string? FirstName,
    string? LastName,
    string? PhoneNumber
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
