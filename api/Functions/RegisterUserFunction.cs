using System.Net;
using BCrypt.Net;
using static BCrypt.Net.BCrypt;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Azure Function to register a user with a valid invitation token
/// Creates user in database and marks invitation as used
/// </summary>
public class RegisterUserFunction
{
    private readonly IUserRepository _userRepository;
    private readonly IInvitationRepository _invitationRepository;
    private readonly TokenService _tokenService;
    private readonly JwtService _jwtService;
    private readonly IConfiguration _config;
    private readonly ILogger<RegisterUserFunction> _logger;

    public RegisterUserFunction(
        IUserRepository userRepository,
        IInvitationRepository invitationRepository,
        TokenService tokenService,
        JwtService jwtService,
        IConfiguration config,
        ILogger<RegisterUserFunction> logger)
    {
        _userRepository = userRepository;
        _invitationRepository = invitationRepository;
        _tokenService = tokenService;
        _jwtService = jwtService;
        _config = config;
        _logger = logger;
    }

    [Function("RegisterUser")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/register")]
        HttpRequestData req)
    {
        _logger.LogInformation("RegisterUser function called");

        try
        {
            var body = await req.ReadFromJsonAsync<RegisterUserRequest>();
            if (body == null)
            {
                _logger.LogWarning("Invalid request body");
                return ErrorResponse(req, "Invalid request", HttpStatusCode.BadRequest);
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(body.Token))
                return ErrorResponse(req, "Token es requerido", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(body.FirstName))
                return ErrorResponse(req, "Nombres es requerido", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(body.LastName))
                return ErrorResponse(req, "Apellidos es requerido", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(body.PhoneNumber))
                return ErrorResponse(req, "Número de celular es requerido", HttpStatusCode.BadRequest);

            if (string.IsNullOrWhiteSpace(body.Password) || body.Password.Length < 8)
                return ErrorResponse(req, "La contraseña debe tener mínimo 8 caracteres", HttpStatusCode.BadRequest);

            // 1. Decrypt token
            var decrypted = _tokenService.Decrypt(body.Token);
            if (decrypted is null || DateTime.UtcNow > decrypted.Value.expiresAt)
            {
                _logger.LogWarning("Invalid or expired token");
                return ErrorResponse(req, "Token inválido o expirado.", HttpStatusCode.BadRequest);
            }

            var email = decrypted.Value.email;

            // 2. Find invitation document
            var invite = await _invitationRepository.GetByTokenAsync(body.Token);

            if (invite is null)
            {
                _logger.LogWarning("Invitation document not found");
                return ErrorResponse(req, "Invitación no encontrada.", HttpStatusCode.NotFound);
            }

            if (invite.Status == "used")
            {
                _logger.LogWarning("Invitation already used: {Email}", email);
                return ErrorResponse(req, "Este enlace ya fue utilizado.", HttpStatusCode.BadRequest);
            }

            if (invite.Status == "expired")
            {
                _logger.LogWarning("Invitation is expired: {Email}", email);
                return ErrorResponse(req, "La invitación ha expirado.", HttpStatusCode.BadRequest);
            }

            // 3. Create user entity
            var userEntity = new Infrastructure.Entities.UserEntity
            {
                Id = Guid.NewGuid().ToString(),
                Email = email,
                FirstName = body.FirstName.Trim(),
                LastName = body.LastName.Trim(),
                DisplayName = $"{body.FirstName.Trim()} {body.LastName.Trim()}",
                PhoneNumber = body.PhoneNumber.Trim(),
                PasswordHash = ComputePasswordHash(body.Password),
                Status = "active",
                Role = "user",
                CreatedAtUtc = DateTime.UtcNow,
                IsEmailVerified = true  // Email verified via invitation link
            };

            // 4. Save user to database
            try
            {
                await _userRepository.CreateAsync(userEntity);
                _logger.LogInformation("User created: {Email}", email);
            }
            catch (Exception ex) when (ex.Message.Contains("Conflict"))
            {
                _logger.LogWarning("User already exists: {Email}", email);
                return ErrorResponse(req, "Este usuario ya está registrado.", HttpStatusCode.BadRequest);
            }

            // 5. Mark invitation as used
            await _invitationRepository.MarkAsUsedAsync(invite.Id, userEntity.Id);

            _logger.LogInformation("Invitation marked as used: {Email}", email);

            // 6. Generate JWT token
            var jwtToken = _jwtService.GenerateToken(userEntity);

            // 7. Return success response
            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new RegisterUserResponse(
                Success: true,
                UserId: userEntity.Id,
                Email: userEntity.Email,
                Token: jwtToken
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    /// <summary>
    /// Hash password using BCrypt with cost factor 12
    /// Cost factor 12 = ~100ms on modern server
    /// Includes salt generation automatically
    /// </summary>
    private string ComputePasswordHash(string password)
    {
        try
        {
            // BCrypt.Net automatically:
            // 1. Generates random salt
            // 2. Applies salt to password
            // 3. Performs multiple rounds of hashing
            // 4. Encodes result in bcrypt format
            return BCrypt.Net.BCrypt.HashPassword(password, 12);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hashing password");
            throw new InvalidOperationException("Failed to hash password", ex);
        }
    }

    /// <summary>
    /// Verify password against BCrypt hash
    /// </summary>
    public bool VerifyPassword(string password, string hash)
    {
        try
        {
            return Verify(password, hash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying password");
            return false;
        }
    }

    private static HttpResponseData ErrorResponse(
        HttpRequestData req,
        string message,
        HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new RegisterUserResponse(
            Success: false,
            Message: message
        ));
        return response;
    }
}
