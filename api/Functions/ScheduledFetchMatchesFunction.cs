using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

using WorldCup.Api.Extensions;
namespace WorldCup.Api.Functions;

/// <summary>
/// Scheduled function to fetch World Cup 2026 matches for the next 7 days
/// Runs daily at 3 AM UTC
/// Purpose: Fetch upcoming matches to block predictions after kickoff time
/// </summary>
public class ScheduledFetchMatchesFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<ScheduledFetchMatchesFunction> _logger;

    public ScheduledFetchMatchesFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        ILogger<ScheduledFetchMatchesFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("ScheduledFetchMatches")]
    public async Task Run(
        [TimerTrigger("0 3 * * *")] TimerInfo timer) // Daily at 3 AM UTC
    {
        _logger.LogInformation("=== ScheduledFetchMatches triggered at {time}", DateTime.UtcNow);

        try
        {
            // Fetch World Cup matches
            var worldCupMatches = await _footballDataService.GetWorldCupMatches();

            if (worldCupMatches.Count() == 0)
            {
                _logger.LogWarning("No matches retrieved from Football-Data.org");
                return;
            }

            // Filter for upcoming matches (next 7 days)
            var now = DateTime.UtcNow;
            var upcomingMatches = worldCupMatches
                .Where(m => m.KickoffAtUtc >= now && m.KickoffAtUtc <= now.AddDays(7))
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "Found {TotalMatches} total matches, {UpcomingMatches} upcoming in next 7 days",
                worldCupMatches.Count,
                upcomingMatches.Count);

            if (upcomingMatches.Count > 0)
            {
                // Store/update matches in database
                foreach (var match in upcomingMatches)
                {
                    _logger.LogInformation(
                        "Storing match: {HomeTeam} vs {AwayTeam} - {KickoffTime}",
                        match.HomeTeam,
                        match.AwayTeam,
                        match.KickoffAtUtc);

                    await _matchRepository.UpsertAsync(match.ToEntity());
                }

                _logger.LogInformation(
                    "Successfully stored {Count} upcoming matches",
                    upcomingMatches.Count);
            }

            _logger.LogInformation("ScheduledFetchMatches completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ScheduledFetchMatches: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("ScheduledFetchMatches function is running late!");
        }
    }
}
