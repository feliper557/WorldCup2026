using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Scheduled function to fetch La Liga match results for testing purposes
/// Runs every 5 minutes
/// Purpose: Get final scores after match completion to test behavior before World Cup
/// </summary>
public class ScheduledFetchLaLigaResultsFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<ScheduledFetchLaLigaResultsFunction> _logger;

    // Buffer time: 90 minutes regular + 15 minutes average stoppage time
    private const int BufferMinutesAfterKickoff = 105;

    public ScheduledFetchLaLigaResultsFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<ScheduledFetchLaLigaResultsFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("ScheduledFetchLaLigaResults")]
    public async Task Run(
        [TimerTrigger("*/5 * * * *")] TimerInfo timer) // Every 5 minutes
    {
        _logger.LogInformation("=== ScheduledFetchLaLigaResults triggered at {time}", DateTime.UtcNow);

        try
        {
            // Get all matches
            var allMatches = await _matchRepository.GetAllAsync();
            var now = DateTime.UtcNow;

            // Filter for La Liga matches (stage = "REGULAR_SEASON" or similar)
            // that should be finished by now
            var laLigaMatches = allMatches
                .Where(m => m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            var matchesToCheck = laLigaMatches
                .Where(m => m.Status != "FINISHED"
                    && m.KickoffAtUtc <= now.AddMinutes(-BufferMinutesAfterKickoff))
                .ToList();

            if (matchesToCheck.Count == 0)
            {
                _logger.LogInformation("No La Liga matches to check for results at this time");
                return;
            }

            _logger.LogInformation(
                "Checking {Count} La Liga matches for final results",
                matchesToCheck.Count);

            // Fetch updated La Liga data from Football-Data.org
            var updatedMatches = await _footballDataService.GetSpanishLaLigaMatches();

            int updatedCount = 0;
            int resultCount = 0;

            foreach (var matchToCheck in matchesToCheck)
            {
                var updatedMatch = updatedMatches.FirstOrDefault(m => m.Id == matchToCheck.Id);

                if (updatedMatch == null)
                {
                    _logger.LogWarning("La Liga match {MatchId} not found in updated data", matchToCheck.Id);
                    continue;
                }

                // Check if status has changed to FINISHED and scores are available
                if (updatedMatch.Status == "FINISHED"
                    && updatedMatch.HomeScoreFinal.HasValue
                    && updatedMatch.AwayScoreFinal.HasValue)
                {
                    _logger.LogInformation(
                        "La Liga match finished: {HomeTeam} {HomeScore} - {AwayScore} {AwayTeam}",
                        updatedMatch.HomeTeam,
                        updatedMatch.HomeScoreFinal,
                        updatedMatch.AwayScoreFinal,
                        updatedMatch.AwayTeam);

                    // Update match in database
                    await _matchRepository.UpsertAsync(updatedMatch);
                    updatedCount++;
                    resultCount++;

                    // Calculate and award points to predictions for this match
                    await ProcessMatchPredictions(updatedMatch);
                }
                else if (updatedMatch.Status == "LIVE")
                {
                    _logger.LogInformation(
                        "La Liga match still live: {HomeTeam} vs {AwayTeam}",
                        updatedMatch.HomeTeam,
                        updatedMatch.AwayTeam);

                    // Update match status
                    await _matchRepository.UpsertAsync(updatedMatch);
                    updatedCount++;
                }
                else if (updatedMatch.Status == "IN_PLAY")
                {
                    _logger.LogInformation(
                        "La Liga match in play: {HomeTeam} vs {AwayTeam}",
                        updatedMatch.HomeTeam,
                        updatedMatch.AwayTeam);

                    await _matchRepository.UpsertAsync(updatedMatch);
                    updatedCount++;
                }
            }

            _logger.LogInformation(
                "ScheduledFetchLaLigaResults completed: {UpdatedCount} matches updated, {ResultCount} with final results",
                updatedCount,
                resultCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ScheduledFetchLaLigaResults: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("ScheduledFetchLaLigaResults function is running late!");
        }
    }

    /// <summary>
    /// Process predictions for a completed La Liga match and award points
    /// Calculates points: 3 (exact), 1 (correct winner), 0 (wrong)
    /// Bonus: +5 for Barcelona or Real Madrid (demo matches)
    /// </summary>
    private async Task ProcessMatchPredictions(Models.Match match)
    {
        try
        {
            _logger.LogInformation(
                "⚙️ Processing predictions for La Liga match {MatchId}: {HomeTeam} vs {AwayTeam}",
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

            // Check if Barcelona or Real Madrid is playing (bonus teams)
            var bonusTeams = new[] { "BARCELONA", "REAL MADRID" };
            var hasBonus = bonusTeams.Contains(match.HomeTeam?.ToUpper()) ||
                          bonusTeams.Contains(match.AwayTeam?.ToUpper());

            int processedCount = 0;

            foreach (var prediction in predictions)
            {
                // Calculate base points (3, 1, or 0)
                int basePoints = _scoringService.CalculatePoints(match, new Models.Prediction
                {
                    HomeScorePred = prediction.PredictedHomeScore,
                    AwayScorePred = prediction.PredictedAwayScore
                });

                // Apply team bonus: if exact score (3 pts) on Barcelona/Real Madrid match → 5 pts
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
                "✅ Processed {Count} predictions for La Liga match {MatchId}",
                processedCount,
                match.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Error processing predictions for La Liga match {MatchId}: {Message}",
                match.Id,
                ex.Message);
            // Don't throw - continue processing other matches
        }
    }
}
