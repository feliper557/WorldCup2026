namespace WorldCup.Api.Infrastructure.Entities;

public class UserEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Status { get; set; } = "active";      // active | inactive
    public string Role { get; set; } = "user";           // user | admin
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string? Gender { get; set; }                  // male | female | other
    public bool IsEmailVerified { get; set; } = false;
    public int TotalPoints { get; set; } = 0;
    public int TotalPredictions { get; set; } = 0;
    public int CorrectPredictions { get; set; } = 0;
    public double AccuracyPercentage { get; set; } = 0;
    public int LeaderboardRank { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    public ICollection<PredictionEntity> Predictions { get; set; } = new List<PredictionEntity>();
    public ICollection<ScoreEntity> Scores { get; set; } = new List<ScoreEntity>();
    public ICollection<RaffleParticipantEntity> RaffleParticipations { get; set; } = new List<RaffleParticipantEntity>();
    public ICollection<RaffleWinnerEntity> RaffleWins { get; set; } = new List<RaffleWinnerEntity>();

    // Aliases for backward compatibility
    public DateTime CreatedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public DateTime? LastLoginAtUtc { get => LastLoginAt; set => LastLoginAt = value; }
    public void UpdateLastLogin() => LastLoginAt = DateTime.UtcNow;
}
