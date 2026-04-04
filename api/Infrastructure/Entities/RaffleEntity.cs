namespace WorldCup.Api.Infrastructure.Entities;

public class RaffleEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Prize { get; set; } = string.Empty;
    public int NumberOfWinners { get; set; } = 1;
    public string ParticipationMode { get; set; } = "all"; // all | first_N | manual | gender
    public int? MaxParticipants { get; set; }
    public string? TargetGender { get; set; }
    public string Status { get; set; } = "open";           // open | closed | drawn
    public DateTime? DrawAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;

    public ICollection<RaffleParticipantEntity> Participants { get; set; } = new List<RaffleParticipantEntity>();
    public ICollection<RaffleWinnerEntity> Winners { get; set; } = new List<RaffleWinnerEntity>();

    // Aliases for backward compatibility
    public DateTime CreatedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public DateTime? DrawAtUtc { get => DrawAt; set => DrawAt = value; }
    public bool IsModifiable => Status == "open";
    public List<string> ExecuteDraw(int numberOfWinners)
    {
        if (Participants.Count == 0) return new();
        var pool = Participants.Select(p => p.UserId).ToList();
        var winners = new List<string>();
        var rng = new Random();
        for (int i = 0; i < numberOfWinners && pool.Count > 0; i++)
        {
            int index = rng.Next(pool.Count);
            winners.Add(pool[index]);
            pool.RemoveAt(index);
        }
        return winners;
    }
}
