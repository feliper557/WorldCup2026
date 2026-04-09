using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Endpoint temporal de diagnóstico - REMOVER después de solucionar el problema
/// </summary>
public class DebugTokenFunction
{
    private readonly JwtService _jwtService;
    private readonly IUserRepository _userRepository;

    public DebugTokenFunction(JwtService jwtService, IUserRepository userRepository)
    {
        _jwtService = jwtService;
        _userRepository = userRepository;
    }

    [Function("DebugToken")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "debug-token")] HttpRequestData req)
    {
        var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
        var token = SecureTokenService.ExtractBearerToken(authHeader);

        if (string.IsNullOrEmpty(token))
        {
            var r = req.CreateResponse(HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new { error = "No token provided" });
            return r;
        }

        // Step 1: Validate signature
        var principal = _jwtService.ValidateToken(token);
        if (principal == null)
        {
            var r = req.CreateResponse(HttpStatusCode.Unauthorized);
            await r.WriteAsJsonAsync(new {
                step = "1_signature",
                error = "Token signature invalid or expired",
                detail = _jwtService.LastValidationError,
                secretLength = _jwtService.SecretKeyLength
            });
            return r;
        }

        // Step 2: Extract claims
        var userId = _jwtService.ExtractUserId(principal);
        var role = _jwtService.ExtractRole(principal);
        var email = _jwtService.ExtractEmail(principal);

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(role))
        {
            var r = req.CreateResponse(HttpStatusCode.Unauthorized);
            await r.WriteAsJsonAsync(new { step = "2_claims", userId, role, email, error = "Missing claims" });
            return r;
        }

        // Step 3: Query DB
        var userFromDb = await _userRepository.GetByIdAsync(userId);
        if (userFromDb == null)
        {
            var r = req.CreateResponse(HttpStatusCode.Unauthorized);
            await r.WriteAsJsonAsync(new { step = "3_db", userId, role, error = "User not found in DB" });
            return r;
        }

        // Step 4: Role match
        var roleMatch = string.Equals(userFromDb.Role, role, StringComparison.OrdinalIgnoreCase);

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            step = "4_complete",
            tokenRole = role,
            dbRole = userFromDb.Role,
            dbStatus = userFromDb.Status,
            roleMatch,
            userId,
            email
        });
        return response;
    }
}
