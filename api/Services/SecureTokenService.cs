using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

/// <summary>
/// Secure token validation service that prevents privilege escalation attacks
/// NEVER trust JWT claims alone - always validate role against the database
///
/// Security measures:
/// 1. JWT signature validation (HMAC-SHA256)
/// 2. Token expiration check
/// 3. Cross-check role against database
/// 4. Verify user is still active
/// 5. Log all validation failures for security auditing
/// </summary>
public class SecureTokenService
{
    private readonly JwtService _jwtService;
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _config;
    private readonly ILogger<SecureTokenService> _logger;

    public SecureTokenService(
        JwtService jwtService,
        IUserRepository userRepository,
        IConfiguration config,
        ILogger<SecureTokenService> logger)
    {
        _jwtService = jwtService;
        _userRepository = userRepository;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Validate JWT token AND verify user role against database
    /// This prevents privilege escalation attacks where user tries to modify JWT role
    ///
    /// Returns null if:
    /// - Token is invalid or expired
    /// - User not found in database
    /// - Role in JWT doesn't match database role (CRITICAL - possible tampering)
    /// - User is not active
    /// </summary>
    public async Task<UserContext?> ValidateTokenAndVerifyRole(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return null;

        try
        {
            // Step 1: Validate JWT signature and expiration
            var principal = _jwtService.ValidateToken(token);
            if (principal == null)
            {
                _logger.LogWarning("JWT token validation failed - invalid signature or expired");
                return null;
            }

            // Step 2: Extract claims from JWT
            var userId = _jwtService.ExtractUserId(principal);
            var email = _jwtService.ExtractEmail(principal);
            var roleInToken = _jwtService.ExtractRole(principal);

            _logger.LogInformation("Token claims - UserId={UserId}, Role={Role}, Email={Email}", userId, roleInToken, email);

            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roleInToken))
            {
                _logger.LogWarning("JWT token missing required claims. UserId={UserId}, Role={Role}", userId, roleInToken);
                return null;
            }

            // Step 3: Query database to verify user and get actual role
            var userFromDb = await GetUserFromDatabase(userId);
            if (userFromDb == null)
            {
                _logger.LogWarning("User not found in database: {UserId}", userId);
                return null;
            }

            _logger.LogInformation("DB user - Role={DbRole}, Status={Status}", userFromDb.Role, userFromDb.Status);

            // Step 4: SECURITY CHECK: Cross-validate role (case-insensitive)
            if (!string.Equals(userFromDb.Role, roleInToken, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogError(
                    "SECURITY ALERT: Role mismatch. JWT role={JwtRole}, Database role={DbRole}.",
                    roleInToken,
                    userFromDb.Role
                );
                return null;
            }

            // Step 5: Check user is still active
            if (userFromDb.Status != "active")
            {
                _logger.LogWarning("User account is not active: {UserId}, Status={Status}", userId, userFromDb.Status);
                return null;
            }

            _logger.LogInformation("Token validated and role verified successfully: UserId={UserId}, Role={Role}", userId, userFromDb.Role);

            return new UserContext(
                UserId: userId,
                Email: email ?? userFromDb.Email,
                Role: userFromDb.Role
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token validation");
            return null;
        }
    }

    /// <summary>
    /// Validate token and ensure user has admin role
    /// Use this for all admin-only endpoints
    /// </summary>
    public async Task<UserContext?> ValidateAdminToken(string? token)
    {
        var userContext = await ValidateTokenAndVerifyRole(token);
        if (userContext == null)
            return null;

        if (userContext.Role != "admin")
        {
            _logger.LogWarning(
                "SECURITY ALERT: Non-admin user attempted admin-only action. UserId={UserId}, Role={Role}",
                userContext.UserId,
                userContext.Role
            );
            return null;
        }

        return userContext;
    }

    /// <summary>
    /// Extract Bearer token from Authorization header string
    /// Returns null if format is invalid
    /// </summary>
    public static string? ExtractBearerToken(string? authorizationHeader)
    {
        if (string.IsNullOrWhiteSpace(authorizationHeader))
            return null;

        const string bearerScheme = "Bearer ";
        if (!authorizationHeader.StartsWith(bearerScheme, StringComparison.OrdinalIgnoreCase))
            return null;

        return authorizationHeader.Substring(bearerScheme.Length).Trim();
    }

    /// <summary>
    /// Query database to get user by ID
    /// This is used to verify the role hasn't been tampered with in the JWT
    /// </summary>
    private async Task<WorldCup.Api.Infrastructure.Entities.UserEntity?> GetUserFromDatabase(string userId)
    {
        try
        {
            return await _userRepository.GetByIdAsync(userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying user from database: {UserId}", userId);
            return null;
        }
    }
}
