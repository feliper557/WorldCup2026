using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;

namespace WorldCup.Api.Services;

/// <summary>
/// Service for AES-256 encryption and decryption of invitation tokens
/// </summary>
public interface IEncryptionService
{
    /// <summary>
    /// Encrypt a token using AES-256 (email + expiryDate)
    /// </summary>
    string EncryptToken(string email, DateTime expiryDate);

    /// <summary>
    /// Decrypt a token and extract email and expiry date
    /// </summary>
    (string email, DateTime expiryDate) DecryptToken(string encryptedToken);

    /// <summary>
    /// Hash a password using bcrypt
    /// </summary>
    string HashPassword(string password);

    /// <summary>
    /// Verify a password against its hash
    /// </summary>
    bool VerifyPassword(string password, string hash);
}

public class EncryptionService : IEncryptionService
{
    private readonly ILogger<EncryptionService> _logger;
    private readonly string _encryptionKey;

    // AES key must be 32 bytes for AES-256
    private static readonly byte[] Key = Encoding.UTF8.GetBytes("your-secret-key-must-be-32-bytes!!");

    public EncryptionService(ILogger<EncryptionService> logger)
    {
        _logger = logger;
        // Get encryption key from environment variable
        _encryptionKey = Environment.GetEnvironmentVariable("ENCRYPTION_KEY")
            ?? throw new InvalidOperationException("ENCRYPTION_KEY environment variable not set");
    }

    /// <summary>
    /// Encrypt token using AES-256-CBC
    /// Format: email|expiryDate (separated by pipe)
    /// </summary>
    public string EncryptToken(string email, DateTime expiryDate)
    {
        try
        {
            // Create token payload: email|expiryTicks
            var tokenData = $"{email}|{expiryDate.Ticks}";
            var tokenBytes = Encoding.UTF8.GetBytes(tokenData);

            using (var aes = Aes.Create())
            {
                aes.KeySize = 256;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                // Use a consistent key
                aes.Key = GetKeyBytes();

                // Generate random IV
                aes.GenerateIV();

                using (var encryptor = aes.CreateEncryptor(aes.Key, aes.IV))
                using (var ms = new MemoryStream())
                {
                    // Write IV at the beginning (needed for decryption)
                    ms.Write(aes.IV, 0, aes.IV.Length);

                    using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
                    {
                        cs.Write(tokenBytes, 0, tokenBytes.Length);
                        cs.FlushFinalBlock();
                    }

                    var encryptedBytes = ms.ToArray();
                    // Return as URL-safe Base64
                    return Convert.ToBase64String(encryptedBytes).Replace("+", "-").Replace("/", "_").TrimEnd('=');
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error encrypting token for email: {Email}", email);
            throw new InvalidOperationException($"Failed to encrypt token: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Decrypt token and extract email and expiry date
    /// </summary>
    public (string email, DateTime expiryDate) DecryptToken(string encryptedToken)
    {
        try
        {
            // Convert from URL-safe Base64
            var base64 = encryptedToken.Replace("-", "+").Replace("_", "/");
            var padding = 4 - (base64.Length % 4);
            if (padding != 4)
                base64 += new string('=', padding);

            var encryptedBytes = Convert.FromBase64String(base64);

            using (var aes = Aes.Create())
            {
                aes.KeySize = 256;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;
                aes.Key = GetKeyBytes();

                // Extract IV from the beginning of encrypted bytes
                var iv = new byte[aes.IV.Length];
                Array.Copy(encryptedBytes, 0, iv, 0, iv.Length);
                aes.IV = iv;

                // Extract encrypted data (skip IV)
                var cipherTextBytes = new byte[encryptedBytes.Length - iv.Length];
                Array.Copy(encryptedBytes, iv.Length, cipherTextBytes, 0, cipherTextBytes.Length);

                using (var decryptor = aes.CreateDecryptor(aes.Key, aes.IV))
                using (var ms = new MemoryStream(cipherTextBytes))
                using (var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read))
                using (var sr = new StreamReader(cs, Encoding.UTF8))
                {
                    var tokenData = sr.ReadToEnd();
                    var parts = tokenData.Split('|');

                    if (parts.Length != 2)
                        throw new InvalidOperationException("Invalid token format");

                    var email = parts[0];
                    if (!long.TryParse(parts[1], out var expiryTicks))
                        throw new InvalidOperationException("Invalid expiry date in token");

                    var expiryDate = new DateTime(expiryTicks, DateTimeKind.Utc);

                    return (email, expiryDate);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error decrypting token");
            throw new InvalidOperationException($"Failed to decrypt token: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Hash password using bcrypt with cost factor 12
    /// </summary>
    public string HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be empty", nameof(password));

        try
        {
            // Using System.Security.Cryptography with manual bcrypt implementation
            // For production, install BCrypt.Net-Core NuGet package
            return BCryptHelper.HashPassword(password, 12);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error hashing password");
            throw new InvalidOperationException($"Failed to hash password: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Verify password against bcrypt hash
    /// </summary>
    public bool VerifyPassword(string password, string hash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hash))
            return false;

        try
        {
            return BCryptHelper.VerifyPassword(password, hash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying password");
            return false;
        }
    }

    /// <summary>
    /// Get encryption key as byte array (32 bytes for AES-256)
    /// </summary>
    private byte[] GetKeyBytes()
    {
        // Generate a consistent 32-byte key from the encryption key
        using (var sha256 = System.Security.Cryptography.SHA256.Create())
        {
            return sha256.ComputeHash(Encoding.UTF8.GetBytes(_encryptionKey));
        }
    }
}

/// <summary>
/// Simple bcrypt helper class
/// For production, use BCrypt.Net-Core NuGet package
/// </summary>
internal static class BCryptHelper
{
    public static string HashPassword(string password, int workFactor = 12)
    {
        // This is a placeholder - in production use BCrypt.Net-Core
        // For now, use PBKDF2 as temporary solution
        using (var pbkdf2 = new Rfc2898DeriveBytes(password, 16, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256))
        {
            var salt = pbkdf2.Salt;
            var key = pbkdf2.GetBytes(32);

            var saltAndKey = new byte[salt.Length + key.Length];
            Buffer.BlockCopy(salt, 0, saltAndKey, 0, salt.Length);
            Buffer.BlockCopy(key, 0, saltAndKey, salt.Length, key.Length);

            return Convert.ToBase64String(saltAndKey);
        }
    }

    public static bool VerifyPassword(string password, string hash)
    {
        var saltAndKey = Convert.FromBase64String(hash);
        var salt = new byte[16];
        var key = new byte[32];

        Buffer.BlockCopy(saltAndKey, 0, salt, 0, 16);
        Buffer.BlockCopy(saltAndKey, 16, key, 0, 32);

        using (var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, System.Security.Cryptography.HashAlgorithmName.SHA256))
        {
            var computedKey = pbkdf2.GetBytes(32);
            return CompareByteArrays(key, computedKey);
        }
    }

    private static bool CompareByteArrays(byte[] array1, byte[] array2)
    {
        if (array1.Length != array2.Length)
            return false;

        int result = 0;
        for (int i = 0; i < array1.Length; i++)
        {
            result |= array1[i] ^ array2[i];
        }

        return result == 0;
    }
}
