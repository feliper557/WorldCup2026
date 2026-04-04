namespace WorldCup.Api.Models;

/// <summary>
/// Prediction DTO for API responses
/// </summary>
public class Prediction
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string MatchId { get; set; } = string.Empty;
    public int PredictedHomeScore { get; set; }
    public int PredictedAwayScore { get; set; }
    public string? PredictedWinner { get; set; }
    public int PointsEarned { get; set; } = 0;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Aliases for backward compatibility
    public DateTime CreatedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public int HomeScorePred { get => PredictedHomeScore; set => PredictedHomeScore = value; }
    public int AwayScorePred { get => PredictedAwayScore; set => PredictedAwayScore = value; }
}
