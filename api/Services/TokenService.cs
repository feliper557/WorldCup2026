using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace WorldCup.Api.Services;

/// <summary>
/// Service for encrypting and decrypting invitation tokens
/// Uses AES-256 encryption with static IV
/// </summary>
public class TokenService
{
    private readonly string _key;  // 32 chars para AES-256
    private readonly string _iv;   // 16 chars
    private readonly ILogger<TokenService> _logger;

    public TokenService(IConfiguration config, ILogger<TokenService> logger)
    {
        _logger = logger;
        _key = config["Encryption:Key"]
            ?? throw new InvalidOperationException("Encryption:Key not configured");
        _iv = config["Encryption:IV"]
            ?? throw new InvalidOperationException("Encryption:IV not configured");

        // Validate key and IV lengths
        if (_key.Length != 32)
            throw new InvalidOperationException("Encryption:Key must be exactly 32 characters");

        if (_iv.Length != 16)
            throw new InvalidOperationException("Encryption:IV must be exactly 16 characters");

        _logger.LogInformation("TokenService initialized with AES-256 encryption");
    }

    /// <summary>
    /// Encrypt email and expiration date into a token
    /// Format: email|expiresAt (ISO 8601 format)
    /// </summary>
    public string Encrypt(string email, DateTime expiresAt)
    {
        try
        {
            var payload = $"{email}|{expiresAt:O}";

            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(_key);
            aes.IV = Encoding.UTF8.GetBytes(_iv);

            using var ms = new MemoryStream();
            using (var cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            using (var sw = new StreamWriter(cs))
                sw.Write(payload);

            // URL-safe Base64 encoding
            return Convert.ToBase64String(ms.ToArray())
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error encrypting token for email: {Email}", email);
            throw new InvalidOperationException("Failed to encrypt token", ex);
        }
    }

    /// <summary>
    /// Decrypt a token and extract email and expiration date
    /// Returns null if decryption fails
    /// </summary>
    public (string email, DateTime expiresAt)? Decrypt(string token)
    {
        try
        {
            // Reverse URL-safe Base64 encoding
            var padded = token
                .Replace("-", "+")
                .Replace("_", "/");

            var mod = padded.Length % 4;
            if (mod > 0)
                padded += new string('=', 4 - mod);

            using var aes = Aes.Create();
            aes.Key = Encoding.UTF8.GetBytes(_key);
            aes.IV = Encoding.UTF8.GetBytes(_iv);

            using var ms = new MemoryStream(Convert.FromBase64String(padded));
            using var cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read);
            using var sr = new StreamReader(cs);
            var payload = sr.ReadToEnd();

            var parts = payload.Split('|');
            if (parts.Length != 2)
            {
                _logger.LogWarning("Invalid token payload format");
                return null;
            }

            var email = parts[0];
            if (!DateTime.TryParse(parts[1], null, DateTimeStyles.RoundtripKind, out var expiresAt))
            {
                _logger.LogWarning("Invalid expiration date in token");
                return null;
            }

            return (email, expiresAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decrypting token");
            return null;
        }
    }

    /// <summary>
    /// Generate a simple invitation code for display purposes
    /// </summary>
    public static string GenerateInvitationCode()
    {
        return Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
    }
}
