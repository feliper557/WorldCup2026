namespace WorldCup.Api.Models;

/// <summary>
/// Invitation DTO for API responses and services
/// </summary>
public class Invitation
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? RecipientName { get; set; }

    // Aliases for backward compatibility with agent-generated code
    public DateTime CreatedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public DateTime ExpiresAtUtc { get => ExpiresAt; set => ExpiresAt = value; }
    public string? EncryptedToken { get => Token; set => Token = value ?? ""; }
    public DateTime? ExpiryDate { get => ExpiresAt; set => ExpiresAt = value ?? DateTime.MinValue; }
    public string? CreatedByAdmin { get => CreatedBy; set => CreatedBy = value ?? ""; }
    public string? NotificationChannel { get; set; }
    public string? PhoneNumber { get; set; }
    public string? InvitationCode { get; set; }
    public string? CustomMessage { get; set; }

    public bool IsValid => Status == "pending" && ExpiresAt > DateTime.UtcNow;
}
