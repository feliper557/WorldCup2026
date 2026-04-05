using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

using WorldCup.Api.Extensions;
namespace WorldCup.Api.Functions;

/// <summary>
/// Scheduled function to fetch La Liga matches for testing purposes
/// Runs daily at 3 AM UTC
/// Purpose: Fetch upcoming La Liga matches to test behavior before World Cup
/// </summary>
public class ScheduledFetchLaLigaMatchesFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<ScheduledFetchLaLigaMatchesFunction> _logger;

    public ScheduledFetchLaLigaMatchesFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        ILogger<ScheduledFetchLaLigaMatchesFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("ScheduledFetchLaLigaMatches")]
    public async Task Run(
        [TimerTrigger("0 3 * * *")] TimerInfo timer) // Daily at 3 AM UTC
    {
        _logger.LogInformation("=== ScheduledFetchLaLigaMatches triggered at {time}", DateTime.UtcNow);

        try
        {
            // Fetch La Liga matches
            var laLigaMatches = await _footballDataService.GetSpanishLaLigaMatches();

            if (laLigaMatches.Count() == 0)
            {
                _logger.LogWarning("No La Liga matches retrieved from Football-Data.org");
                return;
            }

            // Filter for upcoming matches (next 7 days)
            var now = DateTime.UtcNow;
            var upcomingMatches = laLigaMatches
                .Where(m => m.KickoffAtUtc >= now && m.KickoffAtUtc <= now.AddDays(7))
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "Found {TotalMatches} total La Liga matches, {UpcomingMatches} upcoming in next 7 days",
                laLigaMatches.Count,
                upcomingMatches.Count);

            if (upcomingMatches.Count > 0)
            {
                // Store/update matches in database
                foreach (var match in upcomingMatches)
                {
                    _logger.LogInformation(
                        "Storing La Liga match: {HomeTeam} vs {AwayTeam} - {KickoffTime}",
                        match.HomeTeam,
                        match.AwayTeam,
                        match.KickoffAtUtc);

                    await _matchRepository.UpsertAsync(match.ToEntity());
                }

                _logger.LogInformation(
                    "Successfully stored {Count} upcoming La Liga matches",
                    upcomingMatches.Count);
            }
            else
            {
                _logger.LogInformation("No upcoming La Liga matches in the next 7 days");
            }

            _logger.LogInformation("ScheduledFetchLaLigaMatches completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ScheduledFetchLaLigaMatches: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("ScheduledFetchLaLigaMatches function is running late!");
        }
    }
}
