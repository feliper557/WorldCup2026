namespace WorldCup.Api.Models;

/// <summary>
/// Match DTO for API responses
/// </summary>
public class Match
{
    public string Id { get; set; } = string.Empty;
    public string HomeTeam { get; set; } = string.Empty;
    public string AwayTeam { get; set; } = string.Empty;
    public string Stage { get; set; } = string.Empty;
    public string Group { get; set; } = string.Empty;
    public DateTime MatchDate { get; set; }
    public string Status { get; set; } = "scheduled";
    public int? HomeScore { get; set; }
    public int? AwayScore { get; set; }
    public string? Venue { get; set; }
    public int? ExternalId { get; set; }
    public DateTime CreatedAt { get; set; }
    // TournamentId is not persisted in current schema - kept for future use
    public int? HomeScoreFinal { get => HomeScore; set => HomeScore = value; }
    public int? AwayScoreFinal { get => AwayScore; set => AwayScore = value; }
    public DateTime KickoffAtUtc { get => MatchDate; set => MatchDate = value; }
}
