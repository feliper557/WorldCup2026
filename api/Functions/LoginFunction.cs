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

/// <summary>
/// Azure Function to authenticate user with email and password
/// Returns user info if credentials are valid
/// </summary>
public class LoginFunction
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<LoginFunction> _logger;
    private readonly JwtService _jwtService;

    public LoginFunction(
        IUserRepository userRepository,
        ILogger<LoginFunction> logger,
        JwtService jwtService)
    {
        _userRepository = userRepository;
        _logger = logger;
        _jwtService = jwtService;
    }

    [Function("Login")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")]
        HttpRequestData req)
    {
        _logger.LogInformation("Login function called");

        try
        {
            var body = await req.ReadFromJsonAsync<LoginRequest>();
            if (body == null)
            {
                _logger.LogWarning("Invalid request body");
                return await ErrorResponse(req, "Invalid request", HttpStatusCode.BadRequest);
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(body.Email) || string.IsNullOrWhiteSpace(body.Password))
            {
                _logger.LogWarning("Missing email or password");
                return await ErrorResponse(req, "Email y contraseña son requeridos", HttpStatusCode.BadRequest);
            }

            // Find user by email
            var user = await _userRepository.GetByEmailAsync(body.Email);
            if (user is null)
            {
                _logger.LogWarning("Login attempt for non-existent user: {Email}", body.Email);
                // Don't reveal if user exists or not (security)
                return await ErrorResponse(req, "Email o contraseña inválidos", HttpStatusCode.Unauthorized);
            }

            // Check if user is active
            if (user.Status != "active")
            {
                _logger.LogWarning("Login attempt for inactive user: {Email}", body.Email);
                return await ErrorResponse(req, "La cuenta no está activa", HttpStatusCode.Forbidden);
            }

            // Verify password using BCrypt
            bool passwordValid = Verify(body.Password, user.PasswordHash);
            if (!passwordValid)
            {
                _logger.LogWarning("Invalid password for user: {Email}", body.Email);
                // Don't reveal if password is wrong (security)
                return await ErrorResponse(req, "Email o contraseña inválidos", HttpStatusCode.Unauthorized);
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("User logged in successfully: {Email}", body.Email);

            // Generate JWT token
            var jwtToken = _jwtService.GenerateToken(user);

            // DIAGNOSTIC: validate the freshly-issued token in the SAME process that signed it
            var selfValidation = _jwtService.ValidateToken(jwtToken);
            var diagnostic = new
            {
                signSecretPrefix = _jwtService.SecretKeyPrefix,
                signSecretLength = _jwtService.SecretKeyLength,
                tokenSelfValid = selfValidation != null,
                selfValidError = _jwtService.LastValidationError
            };
            _logger.LogWarning("LOGIN_DIAG {@Diag}", diagnostic);

            // Create response with user info
            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("X-Sign-Secret-Prefix", _jwtService.SecretKeyPrefix);
            response.Headers.Add("X-Sign-Secret-Length", _jwtService.SecretKeyLength.ToString());
            response.Headers.Add("X-Token-Self-Valid", (selfValidation != null).ToString());
            await response.WriteAsJsonAsync(new LoginResponse(
                Success: true,
                UserId: user.Id,
                Email: user.Email,
                Token: jwtToken,
                User: new UserProfileResponse(
                    Id: user.Id,
                    Email: user.Email,
                    DisplayName: user.DisplayName,
                    Role: user.Role,
                    TotalPoints: user.TotalPoints,
                    TotalPredictions: user.TotalPredictions,
                    CorrectPredictions: user.CorrectPredictions,
                    AccuracyPercentage: user.AccuracyPercentage,
                    LeaderboardRank: user.LeaderboardRank
                )
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error durante el login");
            return await ErrorResponse(req, "Error durante el login", HttpStatusCode.InternalServerError);
        }
    }

    private static async Task<HttpResponseData> ErrorResponse(
        HttpRequestData req,
        string message,
        HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        await response.WriteAsJsonAsync(new LoginResponse(
            Success: false,
            Message: message
        ));
        return response;
    }
}

/// <summary>
/// Login request model
/// </summary>
public record LoginRequest(string Email, string Password);
