using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Services;
using WorldCup.Api.Extensions;

namespace WorldCup.Api.Functions;

/// <summary>
/// Scheduled function to fetch match results for completed matches
/// Runs every 5 minutes
/// Purpose: Get final scores after match completion (90 min + 15 min stoppage = 105 min buffer)
/// </summary>
public class ScheduledFetchResultsFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<ScheduledFetchResultsFunction> _logger;

    // Buffer time: 90 minutes regular + 15 minutes average stoppage time
    private const int BufferMinutesAfterKickoff = 105;

    public ScheduledFetchResultsFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<ScheduledFetchResultsFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("ScheduledFetchResults")]
    public async Task Run(
        [TimerTrigger("*/5 * * * *")] TimerInfo timer) // Every 5 minutes
    {
        _logger.LogInformation("=== ScheduledFetchResults triggered at {time}", DateTime.UtcNow);

        try
        {
            // Get all matches
            var allMatches = await _matchRepository.GetAllAsync();
            var now = DateTime.UtcNow;

            // Filter for matches that should be finished by now
            // (started 105+ minutes ago and still marked as SCHEDULED/LIVE)
            var matchesToCheck = allMatches
                .Where(m => m.Status != "FINISHED"
                    && m.KickoffAtUtc <= now.AddMinutes(-BufferMinutesAfterKickoff))
                .ToList();

            if (matchesToCheck.Count() == 0)
            {
                _logger.LogInformation("No matches to check for results at this time");
                return;
            }

            _logger.LogInformation(
                "Checking {Count} matches for final results",
                matchesToCheck.Count);

            // Fetch updated match data from Football-Data.org
            var updatedMatches = await _footballDataService.GetWorldCupMatches();

            int updatedCount = 0;

            foreach (var matchToCheck in matchesToCheck)
            {
                var updatedMatch = updatedMatches.FirstOrDefault(m => m.Id == matchToCheck.Id);

                if (updatedMatch == null)
                {
                    _logger.LogWarning("Match {MatchId} not found in updated data", matchToCheck.Id);
                    continue;
                }

                // Check if status has changed to FINISHED and scores are available
                if (updatedMatch.Status == "FINISHED"
                    && updatedMatch.HomeScoreFinal.HasValue
                    && updatedMatch.AwayScoreFinal.HasValue)
                {
                    _logger.LogInformation(
                        "Match finished: {HomeTeam} {HomeScore} - {AwayScore} {AwayTeam}",
                        updatedMatch.HomeTeam,
                        updatedMatch.HomeScoreFinal,
                        updatedMatch.AwayScoreFinal,
                        updatedMatch.AwayTeam);

                    // Update match in database
                    await _matchRepository.UpsertAsync(updatedMatch.ToEntity());
                    updatedCount++;

                    // Calculate and award points to predictions for this match
                    // This would be called from a separate service that handles predictions
                    await ProcessMatchPredictions(updatedMatch);
                }
                else if (updatedMatch.Status == "LIVE")
                {
                    _logger.LogInformation(
                        "Match still live: {HomeTeam} vs {AwayTeam}",
                        updatedMatch.HomeTeam,
                        updatedMatch.AwayTeam);

                    // Update match status
                    await _matchRepository.UpsertAsync(updatedMatch.ToEntity());
                    updatedCount++;
                }
            }

            _logger.LogInformation(
                "ScheduledFetchResults completed: {UpdatedCount} matches updated",
                updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ScheduledFetchResults: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("ScheduledFetchResults function is running late!");
        }
    }

    /// <summary>
    /// Process predictions for a completed match and award points
    /// Calculates points: 3 (exact), 1 (correct winner), 0 (wrong)
    /// Bonus: +5 for Colombia (World Cup)
    /// </summary>
    private async Task ProcessMatchPredictions(Models.Match match)
    {
        try
        {
            _logger.LogInformation(
                "⚙️ Processing predictions for match {MatchId}: {HomeTeam} vs {AwayTeam}",
                match.Id,
                match.HomeTeam,
                match.AwayTeam);

            // Get all predictions for this match
            var predictions = await _predictionRepository.GetByMatchIdAsync(match.Id);

            if (!predictions.Any())
            {
                _logger.LogInformation("No predictions found for match {MatchId}", match.Id);
                return;
            }

            // Check if Colombia is playing (bonus team for World Cup)
            var hasBonus = match.HomeTeam?.ToUpper() == "COLOMBIA" ||
                          match.AwayTeam?.ToUpper() == "COLOMBIA";

            int processedCount = 0;

            foreach (var prediction in predictions)
            {
                // Calculate base points (3, 1, or 0)
                int basePoints = _scoringService.CalculatePoints(match, new Models.Prediction
                {
                    HomeScorePred = prediction.PredictedHomeScore,
                    AwayScorePred = prediction.PredictedAwayScore
                });

                // Apply team bonus: if exact score (3 pts) on Colombia match → 5 pts
                // Otherwise use base points
                int totalPoints = (basePoints == 3 && hasBonus) ? 5 : basePoints;

                // Update prediction with earned points
                var predictionEntity = new PredictionEntity
                {
                    Id = prediction.Id,
                    UserId = prediction.UserId,
                    MatchId = prediction.MatchId,
                    PredictedHomeScore = prediction.PredictedHomeScore,
                    PredictedAwayScore = prediction.PredictedAwayScore,
                    PredictedWinner = prediction.PredictedWinner,
                    PointsEarned = totalPoints,
                    CreatedAt = prediction.CreatedAt,
                    UpdatedAt = DateTime.UtcNow
                };

                await _predictionRepository.UpdateAsync(predictionEntity);

                _logger.LogInformation(
                    "✅ Prediction {PredictionId}: {HomeScore}-{AwayScore} → {BasePoints} base + {Bonus} bonus = {Total} pts",
                    prediction.Id,
                    prediction.PredictedHomeScore,
                    prediction.PredictedAwayScore,
                    basePoints,
                    hasBonus ? 5 : 0,
                    totalPoints);

                processedCount++;
            }

            _logger.LogInformation(
                "✅ Processed {Count} predictions for match {MatchId}",
                processedCount,
                match.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error processing predictions for match {MatchId}: {Message}",
                match.Id,
                ex.Message);
            // Don't throw - continue processing other matches
        }
    }
}
