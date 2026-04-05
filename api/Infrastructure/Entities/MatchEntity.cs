namespace WorldCup.Api.Infrastructure.Entities;

public class MatchEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public DateTime MatchDate { get; set; }
    public string Status { get; set; } = "scheduled";  // scheduled | live | finished
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public string? Venue { get; set; }
    public int? ExternalId { get; set; }
    public string? TournamentId { get; set; }  // For identifying La Liga vs World Cup
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PredictionEntity> Predictions { get; set; } = new List<PredictionEntity>();

    // Alias for backward compatibility
    public DateTime KickoffAtUtc { get => MatchDate; set => MatchDate = value; }
}
