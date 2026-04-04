namespace WorldCup.Api.Services;

public interface ITimeProviderService
{
    DateTime UtcNow { get; }
}

public class TimeProviderService : ITimeProviderService
{
    public DateTime UtcNow => DateTime.UtcNow;
}
