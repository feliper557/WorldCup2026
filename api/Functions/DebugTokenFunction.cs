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
        // DIAGNOSTIC: capture ALL Authorization header values and raw state
        var authHeaderEntry = req.Headers.FirstOrDefault(h => h.Key.Equals("Authorization", StringComparison.OrdinalIgnoreCase));
        var authValuesList = authHeaderEntry.Value?.ToList() ?? new List<string>();
        var authHeader = authValuesList.FirstOrDefault();
        // Try reconstructing the full header if split into multiple values
        var authConcatenatedComma = string.Join(",", authValuesList);
        var authConcatenatedSpace = string.Join(" ", authValuesList);
        // Also dump all header keys for sanity
        var allHeaderKeys = string.Join(",", req.Headers.Select(h => h.Key));

        // Try extracting from the concatenated versions too
        var tokenFromComma = SecureTokenService.ExtractBearerToken(authConcatenatedComma);
        var tokenFromSpace = SecureTokenService.ExtractBearerToken(authConcatenatedSpace);
        // PREFER X-Auth-Token (SWA doesn't touch it); fallback to Authorization
        var xAuth = req.Headers
            .FirstOrDefault(h => h.Key.Equals("X-Auth-Token", StringComparison.OrdinalIgnoreCase))
            .Value?.FirstOrDefault();
        var token = !string.IsNullOrWhiteSpace(xAuth)
            ? xAuth.Trim()
            : SecureTokenService.ExtractBearerToken(authHeader);

        if (string.IsNullOrEmpty(token))
        {
            var r = req.CreateResponse(HttpStatusCode.BadRequest);
            await r.WriteAsJsonAsync(new { error = "No token provided" });
            return r;
        }

        // Test: generate a fresh token and validate it immediately
        var testUser = new WorldCup.Api.Infrastructure.Entities.UserEntity
        {
            Id = "test-id",
            Email = "test@test.com",
            Role = "admin",
            DisplayName = "Test"
        };
        var freshToken = _jwtService.GenerateToken(testUser);
        var freshPrincipal = _jwtService.ValidateToken(freshToken);
        var selfTestOk = freshPrincipal != null;

        // Step 1: Validate signature
        var principal = _jwtService.ValidateToken(token);
        if (principal == null)
        {
            var r = req.CreateResponse(HttpStatusCode.Unauthorized);
            await r.WriteAsJsonAsync(new {
                step = "1_signature",
                error = "Token signature invalid or expired",
                detail = _jwtService.LastValidationError,
                secretLength = _jwtService.SecretKeyLength,
                secretPrefix = _jwtService.SecretKeyPrefix,
                secretByteLength = _jwtService.SecretKeyByteLength,
                secretHash = _jwtService.SecretKeyHash,
                receivedTokenLength = token.Length,
                receivedTokenFirst20 = token.Length >= 20 ? token.Substring(0, 20) : token,
                receivedTokenLast20 = token.Length >= 20 ? token.Substring(token.Length - 20) : token,
                rawAuthHeaderLength = authHeader?.Length ?? 0,
                authValueCount = authValuesList.Count,
                authValueLengths = authValuesList.Select(v => v.Length).ToArray(),
                authConcatCommaLength = authConcatenatedComma.Length,
                authConcatSpaceLength = authConcatenatedSpace.Length,
                allHeaderKeys,
                selfTest = selfTestOk ? "PASS - generate+validate works" : "FAIL - generate+validate broken"
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
