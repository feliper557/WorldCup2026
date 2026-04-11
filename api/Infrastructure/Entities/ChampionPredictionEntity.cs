namespace WorldCup.Api.Infrastructure.Entities;

public class ChampionPredictionEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public string Team { get; set; } = string.Empty;
    public string Flag { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public UserEntity User { get; set; } = null!;
}
