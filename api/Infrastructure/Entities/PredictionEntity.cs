namespace WorldCup.Api.Infrastructure.Entities;

public class PredictionEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string MatchId { get; set; } = string.Empty;
    public int PredictedHomeScore { get; set; }
    public int PredictedAwayScore { get; set; }
    public string? PredictedWinner { get; set; }
    public int PointsEarned { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public UserEntity User { get; set; } = null!;
    public MatchEntity Match { get; set; } = null!;
}
