namespace WorldCup.Api.Infrastructure.Entities;

public class ScoreEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string UserId { get; set; } = string.Empty;
    public int TotalPoints { get; set; } = 0;
    public int TotalPredictions { get; set; } = 0;
    public int CorrectPredictions { get; set; } = 0;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public UserEntity User { get; set; } = null!;
}
