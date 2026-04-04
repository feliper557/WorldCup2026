namespace WorldCup.Api.Models;

/// <summary>
/// UserProfile DTO for API responses and services
/// </summary>
public class UserProfile
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public string Role { get; set; } = "user";
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Gender { get; set; }
    public bool IsEmailVerified { get; set; } = false;
    public int TotalPoints { get; set; } = 0;
    public int TotalPredictions { get; set; } = 0;
    public int CorrectPredictions { get; set; } = 0;
    public double AccuracyPercentage { get; set; } = 0;
    public int LeaderboardRank { get; set; } = 0;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? PasswordHash { get; set; }

    // Aliases for backward compatibility
    public DateTime JoinedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public DateTime? LastActiveAtUtc { get => LastLoginAt; set => LastLoginAt = value; }
}
