using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Functions;

/// <summary>
/// Scheduled function that runs every 5 minutes to update match statuses
/// - scheduled → live: when match time has arrived
/// - live → finished: after match is estimated to be over (120 minutes)
/// </summary>
public class UpdateMatchStatusFunction
{
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<UpdateMatchStatusFunction> _logger;

    public UpdateMatchStatusFunction(
        IMatchRepository matchRepository,
        ILogger<UpdateMatchStatusFunction> logger)
    {
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("UpdateMatchStatus")]
    public async Task Run(
        [TimerTrigger("*/5 * * * *")] TimerInfo myTimer)
    {
        _logger.LogInformation("UpdateMatchStatus triggered at {Time}", DateTime.UtcNow);

        try
        {
            var now = DateTime.UtcNow;

            // Get all matches
            var allMatches = await _matchRepository.GetAllAsync();

            foreach (var match in allMatches)
            {
                bool needsUpdate = false;
                string oldStatus = match.Status;

                // scheduled → live: if match time has passed
                if (match.Status == "SCHEDULED" && match.MatchDate <= now)
                {
                    match.Status = "LIVE";
                    needsUpdate = true;
                }
                // live → finished: if match is estimated to be over (120 minutes)
                else if (match.Status == "LIVE" && match.MatchDate.AddMinutes(120) <= now)
                {
                    match.Status = "FINISHED";
                    needsUpdate = true;
                }

                if (needsUpdate)
                {
                    await _matchRepository.UpdateAsync(match);
                    _logger.LogInformation(
                        "Match {MatchId} ({HomeTeam} vs {AwayTeam}) status updated from {OldStatus} to {NewStatus}",
                        match.Id, match.HomeTeam, match.AwayTeam, oldStatus, match.Status);
                }
            }

            _logger.LogInformation("UpdateMatchStatus completed at {Time}", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating match statuses");
        }
    }
}
