namespace WorldCup.Api.Infrastructure.Entities;

public class PasswordResetTokenEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }
    public bool IsUsed { get; set; } = false;

    public bool IsValid => !IsUsed && ExpiresAt > DateTime.UtcNow;

    public UserEntity User { get; set; } = null!;
}
