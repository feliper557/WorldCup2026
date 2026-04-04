namespace WorldCup.Api.Infrastructure.Entities;

public class InvitationEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";     // pending | used | expired
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string? RecipientName { get; set; }
    public string? NotificationChannel { get; set; } = "email";
    public string? PhoneNumber { get; set; }

    // Aliases for backward compatibility
    public DateTime CreatedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public DateTime ExpiresAtUtc { get => ExpiresAt; set => ExpiresAt = value; }
    public bool IsValid => Status == "pending" && ExpiresAt > DateTime.UtcNow;
}
