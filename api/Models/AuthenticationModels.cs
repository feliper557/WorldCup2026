namespace WorldCup.Api.Models;

/// <summary>
/// Result of JWT validation with additional security checks
/// Always validates claims against database in critical operations
/// </summary>
public record JwtValidationResult(
    bool IsValid,
    string? UserId = null,
    string? Email = null,
    string? Role = null,
    string? ErrorMessage = null
);

/// <summary>
/// Represents a validated and database-verified user context
/// Safe to use in protected endpoints
/// </summary>
public record UserContext(
    string UserId,
    string Email,
    string Role  // Verified against database
);
