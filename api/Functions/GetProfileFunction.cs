using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Azure Function to get user profile
/// Requires userId in query parameter (would be JWT in production)
/// </summary>
public class GetProfileFunction
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<GetProfileFunction> _logger;
    private readonly JwtService _jwtService;

    public GetProfileFunction(
        IUserRepository userRepository,
        ILogger<GetProfileFunction> logger,
        JwtService jwtService)
    {
        _userRepository = userRepository;
        _logger = logger;
        _jwtService = jwtService;
    }

    [Function("GetProfile")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/profile")]
        HttpRequestData req)
    {
        _logger.LogInformation("GetProfile function called");

        try
        {
            // Extract JWT token (prefer X-Auth-Token because SWA strips Authorization)
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("Missing or invalid auth token");
                return ErrorResponse(req, "Token es requerido", HttpStatusCode.Unauthorized);
            }

            var principal = _jwtService.ValidateToken(token);
            if (principal == null)
            {
                _logger.LogWarning("Invalid or expired token");
                return ErrorResponse(req, "Token inválido o expirado", HttpStatusCode.Unauthorized);
            }

            var userId = _jwtService.ExtractUserId(principal);
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("No userId in token");
                return ErrorResponse(req, "Token inválido", HttpStatusCode.Unauthorized);
            }

            // Find user by ID
            var user = await _userRepository.GetByIdAsync(userId);

            if (user is null)
            {
                _logger.LogWarning("User not found: {UserId}", userId);
                return ErrorResponse(req, "Usuario no encontrado", HttpStatusCode.NotFound);
            }

            _logger.LogInformation("Profile retrieved for user: {Email}", user.Email);

            // Create response
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new UserProfileResponse(
                Id: user.Id,
                Email: user.Email,
                DisplayName: user.DisplayName,
                Role: user.Role,
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
            _logger.LogError(ex, "Error getting profile");
            return ErrorResponse(req, "Error obteniendo perfil", HttpStatusCode.InternalServerError);
        }
    }

    private static HttpResponseData ErrorResponse(
        HttpRequestData req,
        string message,
        HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
