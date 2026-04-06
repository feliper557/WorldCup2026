using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// DEBUG ONLY - Generate admin JWT token for testing
/// Remove this function before deploying to production
/// </summary>
public class DebugGenerateAdminTokenFunction
{
    private readonly JwtService _jwtService;
    private readonly ILogger<DebugGenerateAdminTokenFunction> _logger;

    public DebugGenerateAdminTokenFunction(
        JwtService jwtService,
        ILogger<DebugGenerateAdminTokenFunction> logger)
    {
        _jwtService = jwtService;
        _logger = logger;
    }

    [Function("DebugGenerateAdminToken")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "debug/generate-admin-token")] HttpRequestData req)
    {
        try
        {
            _logger.LogWarning("⚠️ DEBUG: DebugGenerateAdminToken called - This should only be used in development!");

            // Read request body
            var body = await req.ReadFromJsonAsync<GenerateTokenRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.UserId) || string.IsNullOrWhiteSpace(body.Email))
            {
                var errorResponse = req.CreateResponse(HttpStatusCode.BadRequest);
                await errorResponse.WriteAsJsonAsync(new { error = "UserId and Email are required" });
                return errorResponse;
            }

            // Create a temporary user entity
            var tempUser = new Infrastructure.Entities.UserEntity
            {
                Id = body.UserId,
                Email = body.Email,
                Role = "admin", // Force admin role
                Status = "active",
                DisplayName = body.DisplayName ?? "Admin",
                CreatedAtUtc = DateTime.UtcNow,
                LastLoginAtUtc = DateTime.UtcNow,
                TotalPoints = 0
            };

            // Generate JWT token
            var token = _jwtService.GenerateToken(tempUser);

            _logger.LogWarning("⚠️ DEBUG: Generated admin token for UserId={UserId}", body.UserId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                token = token,
                expiresIn = "60 minutes",
                warning = "⚠️ This is a debug token - only use in development/testing"
            });

            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating admin token");
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new { error = ex.Message });
            return response;
        }
    }

    public class GenerateTokenRequest
    {
        public string? UserId { get; set; }
        public string? Email { get; set; }
        public string? DisplayName { get; set; }
    }
}
