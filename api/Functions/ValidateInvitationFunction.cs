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
/// Azure Function to validate an invitation token
/// Checks if token is valid, not expired, and not already used
/// </summary>
public class ValidateInvitationFunction
{
    private readonly IInvitationRepository _invitationRepository;
    private readonly TokenService _tokenService;
    private readonly ILogger<ValidateInvitationFunction> _logger;

    public ValidateInvitationFunction(
        IInvitationRepository invitationRepository,
        TokenService tokenService,
        ILogger<ValidateInvitationFunction> logger)
    {
        _invitationRepository = invitationRepository;
        _tokenService = tokenService;
        _logger = logger;
    }

    [Function("ValidateInvitation")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/validate-invitation")]
        HttpRequestData req)
    {
        _logger.LogInformation("ValidateInvitation function called");

        try
        {
            var token = req.Query["token"];
            if (string.IsNullOrEmpty(token))
            {
                _logger.LogWarning("No token provided");
                return ErrorResponse(req, "Token is required", HttpStatusCode.BadRequest);
            }

            // 1. Decrypt token
            var decrypted = _tokenService.Decrypt(token);
            if (decrypted is null)
            {
                _logger.LogWarning("Failed to decrypt token");
                return ErrorResponse(req, "Token inválido.", HttpStatusCode.BadRequest);
            }

            var (email, expiresAt) = decrypted.Value;

            // 2. Check expiration
            if (DateTime.UtcNow > expiresAt)
            {
                _logger.LogWarning("Token expired for email: {Email}", email);
                return ErrorResponse(req, "El enlace ha expirado.", HttpStatusCode.BadRequest);
            }

            // 3. Check if invitation exists and hasn't been used
            var doc = await _invitationRepository.GetByTokenAsync(token);

            if (doc is null)
            {
                _logger.LogWarning("Invitation document not found for token");
                return ErrorResponse(req, "Invitación no encontrada.", HttpStatusCode.NotFound);
            }

            if (doc.Status == "used")
            {
                _logger.LogWarning("Invitation already used: {Email}", email);
                return ErrorResponse(req, "Este enlace ya fue utilizado.", HttpStatusCode.BadRequest);
            }

            if (doc.Status == "expired")
            {
                _logger.LogWarning("Invitation marked as expired: {Email}", email);
                return ErrorResponse(req, "La invitación ha expirado.", HttpStatusCode.BadRequest);
            }

            _logger.LogInformation("Invitation validated successfully for email: {Email}", email);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new ValidateInvitationResponse(
                Valid: true,
                Email: email
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating invitation");
            return ErrorResponse(req, "Error validating invitation", HttpStatusCode.InternalServerError);
        }
    }

    private static HttpResponseData ErrorResponse(
        HttpRequestData req,
        string message,
        HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new ValidateInvitationResponse(
            Valid: false,
            Message: message
        ));
        return response;
    }
}
