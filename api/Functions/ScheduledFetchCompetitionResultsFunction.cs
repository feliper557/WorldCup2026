using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Unified scheduled function for fetching match results
/// Automatically switches between La Liga and World Cup based on date
/// Runs every 5 minutes to fetch completed match results
/// </summary>
public class ScheduledFetchCompetitionResultsFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<ScheduledFetchCompetitionResultsFunction> _logger;

    // Buffer time: 90 minutes regular + 15 minutes average stoppage time
    private const int BufferMinutesAfterKickoff = 105;

    // World Cup 2026 dates
    private static readonly DateTime WORLD_CUP_START = new DateTime(2026, 6, 11);
    private static readonly DateTime WORLD_CUP_END = new DateTime(2026, 6, 25);
    private static readonly DateTime WORLD_CUP_FULL_LOAD = new DateTime(2026, 6, 1);
    private static readonly DateTime WORLD_CUP_LIVE = new DateTime(2026, 6, 11);

    public ScheduledFetchCompetitionResultsFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<ScheduledFetchCompetitionResultsFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("ScheduledFetchCompetitionResults")]
    public async Task Run(
        [TimerTrigger("*/5 * * * *")] TimerInfo timer) // Every 5 minutes
    {
        var now = DateTime.UtcNow;
        _logger.LogInformation("=== ScheduledFetchCompetitionResults triggered at {time} UTC", now);

        try
        {
            // Determine which competition to fetch results from
            if (now < WORLD_CUP_FULL_LOAD)
            {
                // Before June 1: Fetch La Liga results
                await FetchLaLigaResults(now);
            }
            else if (now >= WORLD_CUP_FULL_LOAD && now <= new DateTime(2026, 6, 2, 23, 59, 59))
            {
                // June 1-2: No results yet (matches start June 11)
                _logger.LogInformation("⏳ World Cup loading phase - No matches yet (start June 11)");
            }
            else if (now >= new DateTime(2026, 6, 3) && now < WORLD_CUP_LIVE)
            {
                // June 3-10: Back to La Liga results
                await FetchLaLigaResults(now);
            }
            else if (now >= WORLD_CUP_LIVE)
            {
                // June 11+: World Cup results
                await FetchWorldCupResults(now);
            }

            _logger.LogInformation("ScheduledFetchCompetitionResults completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ScheduledFetchCompetitionResults: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("ScheduledFetchCompetitionResults function is running late!");
        }
    }

    /// <summary>
    /// Fetch La Liga match results for matches that should be finished
    /// </summary>
    private async Task FetchLaLigaResults(DateTime now)
    {
        _logger.LogInformation("📊 Fetching LA LIGA results...");

        try
        {
            var allMatches = await _matchRepository.GetAllAsync();

            // Filter for La Liga matches that should be finished
            var laLigaMatches = allMatches
                .Where(m => m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            var matchesToCheck = laLigaMatches
                .Where(m => m.Status != "FINISHED"
                    && m.KickoffAtUtc <= now.AddMinutes(-BufferMinutesAfterKickoff))
                .ToList();

            if (matchesToCheck.Count() == 0)
            {
                _logger.LogInformation("No La Liga matches to check for results");
                return;
            }

            _logger.LogInformation("La Liga: Checking {Count} matches for results", matchesToCheck.Count);

            // Fetch updated La Liga data
            var updatedMatches = await _footballDataService.GetSpanishLaLigaMatches();
            int updatedCount = 0;

            foreach (var matchToCheck in matchesToCheck)
            {
                var updatedMatch = updatedMatches.FirstOrDefault(m => m.Id == matchToCheck.Id);

                if (updatedMatch == null)
                {
                    continue;
                }

                if (updatedMatch.Status == "FINISHED"
                    && updatedMatch.HomeScoreFinal.HasValue
                    && updatedMatch.AwayScoreFinal.HasValue)
                {
                    _logger.LogInformation(
                        "La Liga finished: {HomeTeam} {HomeScore} - {AwayScore} {AwayTeam}",
                        updatedMatch.HomeTeam,
                        updatedMatch.HomeScoreFinal,
                        updatedMatch.AwayScoreFinal,
                        updatedMatch.AwayTeam);

                    await _matchRepository.UpsertAsync(updatedMatch);
                    await ProcessMatchPredictions(updatedMatch);
                    updatedCount++;
                }
                else if (updatedMatch.Status == "LIVE" || updatedMatch.Status == "IN_PLAY")
                {
                    await _matchRepository.UpsertAsync(updatedMatch);
                    updatedCount++;
                }
            }

            _logger.LogInformation("✅ La Liga: Updated {Count} matches", updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching La Liga results: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Fetch World Cup match results
    /// </summary>
    private async Task FetchWorldCupResults(DateTime now)
    {
        _logger.LogInformation("🌍 Fetching WORLD CUP results...");

        try
        {
            var allMatches = await _matchRepository.GetAllAsync();

            // Filter for World Cup matches that should be finished
            var worldCupMatches = allMatches
                .Where(m => m.TournamentId?.Contains("2026", StringComparison.OrdinalIgnoreCase) == true ||
                           m.Stage?.Contains("GROUP", StringComparison.OrdinalIgnoreCase) == true ||
                           m.Stage?.Contains("ROUND", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            var matchesToCheck = worldCupMatches
                .Where(m => m.Status != "FINISHED"
                    && m.KickoffAtUtc <= now.AddMinutes(-BufferMinutesAfterKickoff))
                .ToList();

            if (matchesToCheck.Count() == 0)
            {
                _logger.LogInformation("No World Cup matches to check for results");
                return;
            }

            _logger.LogInformation("🌍 World Cup: Checking {Count} matches for results", matchesToCheck.Count);

            // Fetch updated World Cup data
            var updatedMatches = await _footballDataService.GetWorldCupMatches();
            int updatedCount = 0;

            foreach (var matchToCheck in matchesToCheck)
            {
                var updatedMatch = updatedMatches.FirstOrDefault(m => m.Id == matchToCheck.Id);

                if (updatedMatch == null)
                {
                    continue;
                }

                if (updatedMatch.Status == "FINISHED"
                    && updatedMatch.HomeScoreFinal.HasValue
                    && updatedMatch.AwayScoreFinal.HasValue)
                {
                    _logger.LogInformation(
                        "🌍 World Cup finished: {HomeTeam} {HomeScore} - {AwayScore} {AwayTeam} ({Stage})",
                        updatedMatch.HomeTeam,
                        updatedMatch.HomeScoreFinal,
                        updatedMatch.AwayScoreFinal,
                        updatedMatch.AwayTeam,
                        updatedMatch.Stage ?? "UNKNOWN");

                    await _matchRepository.UpsertAsync(updatedMatch);
                    await ProcessMatchPredictions(updatedMatch);
                    updatedCount++;
                }
                else if (updatedMatch.Status == "LIVE" || updatedMatch.Status == "IN_PLAY")
                {
                    await _matchRepository.UpsertAsync(updatedMatch);
                    updatedCount++;
                }
            }

            _logger.LogInformation("✅ World Cup: Updated {Count} matches", updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching World Cup results: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Process predictions and award points based on match result
    /// Calculates points: 3 (exact), 1 (correct winner), 0 (wrong)
    /// Bonuses: +5 for Colombia matches (World Cup) or Barcelona/Real Madrid (La Liga demo)
    /// </summary>
    private async Task ProcessMatchPredictions(Models.Match match)
    {
        try
        {
            _logger.LogInformation("⚙️ Processing predictions for match {MatchId}: {HomeTeam} vs {AwayTeam}",
                match.Id, match.HomeTeam, match.AwayTeam);

            // Get all predictions for this match
            var predictions = await _predictionRepository.GetByMatchIdAsync(match.Id);

            if (!predictions.Any())
            {
                _logger.LogInformation("No predictions found for match {MatchId}", match.Id);
                return;
            }

            // Check if this is a demo match (La Liga) or World Cup
            var isDemo = match.Stage?.ToUpper().Contains("REGULAR") ?? false;
            var bonusTeams = isDemo
                ? new[] { "BARCELONA", "REAL MADRID" }  // Demo bonus teams
                : new[] { "COLOMBIA" };  // World Cup bonus team

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

                // Apply team bonus: if exact score (3 pts) on Colombia/Barcelona/Real Madrid match → 5 pts
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

            _logger.LogInformation("✅ Processed {Count} predictions for match {MatchId}",
                processedCount, match.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing predictions for match {MatchId}: {Message}",
                match.Id, ex.Message);
        }
    }
}
