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
/// Admin-only function to manage invitations
/// Requires admin role verified via JWT
/// </summary>
public class AdminInvitationsFunction
{
    private readonly IInvitationRepository _invitationRepository;
    private readonly IUserRepository _userRepository;
    private readonly TokenService _tokenService;
    private readonly SecureTokenService _secureTokenService;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminInvitationsFunction> _logger;

    public AdminInvitationsFunction(
        IInvitationRepository invitationRepository,
        IUserRepository userRepository,
        TokenService tokenService,
        SecureTokenService secureTokenService,
        IConfiguration config,
        ILogger<AdminInvitationsFunction> logger)
    {
        _invitationRepository = invitationRepository;
        _userRepository = userRepository;
        _tokenService = tokenService;
        _secureTokenService = secureTokenService;
        _config = config;
        _logger = logger;
    }

    [Function("AdminCreateInvitation")]
    public async Task<HttpResponseData> CreateInvitation(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/invitations")]
        HttpRequestData req)
    {
        _logger.LogInformation("CreateInvitation called");

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Read request body
            var body = await req.ReadFromJsonAsync<CreateInvitationRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.Email))
                return ErrorResponse(req, "Email es requerido", HttpStatusCode.BadRequest);

            // 3. Check if user already exists
            if (await _userRepository.EmailExistsAsync(body.Email))
                return ErrorResponse(req, "El usuario ya existe", HttpStatusCode.BadRequest);

            // 4. Create invitation entity
            var expiresAt = DateTime.UtcNow.AddHours(24);
            var encryptedToken = _tokenService.Encrypt(body.Email, expiresAt);
            var invitationCode = TokenService.GenerateInvitationCode();

            var invitationEntity = new Infrastructure.Entities.InvitationEntity
            {
                Id = Guid.NewGuid().ToString(),
                Email = body.Email,
                Token = encryptedToken,
                Status = "pending",
                CreatedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = expiresAt,
                NotificationChannel = body.NotificationChannel ?? "email",
                PhoneNumber = body.PhoneNumber
            };

            await _invitationRepository.CreateAsync(invitationEntity);

            // 5. Build registration link
            var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:3000";
            var registrationLink = $"{baseUrl}/register?token={Uri.EscapeDataString(encryptedToken)}&code={invitationCode}";

            _logger.LogInformation("Invitation created by admin {AdminId} for {Email}", admin.UserId, body.Email);

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(new CreateInvitationResponse(
                Link: registrationLink,
                ExpiresAt: expiresAt,
                InvitationCode: invitationCode
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invitation");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminResendInvitation")]
    public async Task<HttpResponseData> ResendInvitation(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/invitations/{invitationId}/resend")]
        HttpRequestData req,
        string invitationId)
    {
        _logger.LogInformation("ResendInvitation called for {InvitationId}", invitationId);

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Fetch existing invitation
            var invitation = await _invitationRepository.GetByIdAsync(invitationId);

            if (invitation == null)
                return ErrorResponse(req, "Invitación no encontrada", HttpStatusCode.NotFound);

            // 3. Generate new token with new expiration
            var newExpiresAt = DateTime.UtcNow.AddHours(24);
            var newEncryptedToken = _tokenService.Encrypt(invitation.Email, newExpiresAt);
            var newInvitationCode = TokenService.GenerateInvitationCode();

            // 4. Update invitation entity
            invitation.Token = newEncryptedToken;
            invitation.ExpiresAtUtc = newExpiresAt;
            invitation.Status = "pending";
            await _invitationRepository.UpdateAsync(invitation);

            // 5. Build new registration link
            var baseUrl = _config["App:BaseUrl"] ?? "http://localhost:3000";
            var newRegistrationLink = $"{baseUrl}/register?token={Uri.EscapeDataString(newEncryptedToken)}&code={newInvitationCode}";

            _logger.LogInformation("Invitation resent by admin {AdminId} for {Email}", admin.UserId, invitation.Email);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new ResendInvitationResponse(
                Success: true,
                NewLink: newRegistrationLink,
                NewExpiresAt: newExpiresAt
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending invitation");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminListInvitations")]
    public async Task<HttpResponseData> ListInvitations(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "mgmt/invitations")]
        HttpRequestData req)
    {
        _logger.LogInformation("ListInvitations called");

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Query all invitations
            var invitations = (await _invitationRepository.GetPendingByAdminAsync(admin.UserId)).ToList();

            _logger.LogInformation("Admin {AdminId} listed {Count} invitations", admin.UserId, invitations.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                invitations = invitations.Select(i => new
                {
                    i.Id,
                    i.Email,
                    i.Status,
                    i.CreatedAtUtc,
                    i.ExpiresAtUtc,
                    i.NotificationChannel
                }),
                total = invitations.Count
            });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing invitations");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private HttpResponseData ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
