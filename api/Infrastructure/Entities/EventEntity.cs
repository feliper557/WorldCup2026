namespace WorldCup.Api.Infrastructure.Entities;

public class EventEntity
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "other";         // watch_party | meeting | activity | other
    public DateTime Date { get; set; }
    public string? Location { get; set; }
    public string? LocationUrl { get; set; }
    public int? MaxCapacity { get; set; }
    public string Status { get; set; } = "active";      // active | cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;

    // Aliases for backward compatibility
    public DateTime CreatedAtUtc { get => CreatedAt; set => CreatedAt = value; }
    public DateTime? UpdatedAtUtc { get; set; }
    public string? UpdatedBy { get; set; }
}
