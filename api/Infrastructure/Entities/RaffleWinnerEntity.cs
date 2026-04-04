namespace WorldCup.Api.Infrastructure.Entities;

public class RaffleWinnerEntity
{
    public string RaffleId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public DateTime DrawnAt { get; set; } = DateTime.UtcNow;

    public RaffleEntity Raffle { get; set; } = null!;
    public UserEntity User { get; set; } = null!;
}
