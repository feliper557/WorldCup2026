using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Services;

/// <summary>
/// Service to generate and validate JWT tokens
/// Tokens include userId (sub), email, and role claims
/// Expiration set to configured duration (default 60 minutes)
/// </summary>
public class JwtService
{
    private readonly IConfiguration _config;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expirationMinutes;

    public JwtService(IConfiguration config)
    {
        _config = config;
        _secretKey = config["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey is not configured");
        _issuer = config["Jwt:Issuer"] ?? "worldcup2026-api";
        _audience = config["Jwt:Audience"] ?? "worldcup2026-app";
        _expirationMinutes = int.TryParse(config["Jwt:ExpirationMinutes"], out var minutes) ? minutes : 60;

        if (_secretKey.Length < 32)
            throw new InvalidOperationException("Jwt:SecretKey must be at least 32 characters");
    }

    /// <summary>
    /// Generate JWT token from user entity
    /// Includes claims: sub (userId), email, role
    /// </summary>
    public string GenerateToken(UserEntity user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),  // sub
            new Claim(ClaimTypes.Email, user.Email),        // email
            new Claim(ClaimTypes.Role, user.Role),          // role: "admin" or "user"
        };

        var token = new JwtSecurityToken(
            issuer: _issuer,
            audience: _audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Validate JWT token and return claims principal
    /// Returns null if token is invalid or expired
    /// </summary>
    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));

            var handler = new JwtSecurityTokenHandler();
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return principal;
        }
        catch (Exception ex)
        {
            // Store last error for debugging
            LastValidationError = ex.Message;
            return null;
        }
    }

    public string? LastValidationError { get; private set; }
    public int SecretKeyLength => _secretKey.Length;
    public string SecretKeyPrefix => _secretKey.Length >= 12 ? _secretKey.Substring(0, 12) : _secretKey;

    /// <summary>
    /// Extract userId from JWT token claims
    /// Returns null if token is invalid or claim not found
    /// </summary>
    public string? ExtractUserId(ClaimsPrincipal? principal)
    {
        return principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }

    /// <summary>
    /// Extract role from JWT token claims
    /// Returns null if token is invalid or claim not found
    /// </summary>
    public string? ExtractRole(ClaimsPrincipal? principal)
    {
        // Try both the full URI claim type and the short "role" claim
        return principal?.FindFirst(ClaimTypes.Role)?.Value
            ?? principal?.FindFirst("role")?.Value;
    }

    /// <summary>
    /// Extract email from JWT token claims
    /// Returns null if token is invalid or claim not found
    /// </summary>
    public string? ExtractEmail(ClaimsPrincipal? principal)
    {
        return principal?.FindFirst(ClaimTypes.Email)?.Value;
    }
}
