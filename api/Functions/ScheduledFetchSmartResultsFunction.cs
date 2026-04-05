using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// UNIFIED SMART Function - Fetch results with same logic
/// Auto-switches La Liga ↔ World Cup based on date
/// Runs every 5 minutes
/// </summary>
public class ScheduledFetchSmartResultsFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<ScheduledFetchSmartResultsFunction> _logger;

    // Buffer: 90 min game + 15 min stoppage
    private const int BufferMinutes = 105;

    // World Cup dates
    private static readonly DateTime WC_FULL_LOAD_START = new DateTime(2026, 6, 1);
    private static readonly DateTime WC_FULL_LOAD_END = new DateTime(2026, 6, 2, 23, 59, 59);
    private static readonly DateTime WC_MATCHES_START = new DateTime(2026, 6, 11);
    private static readonly DateTime WC_MATCHES_END = new DateTime(2026, 6, 27);
    private static readonly DateTime WC_LIVE_START = new DateTime(2026, 6, 10);
    private static readonly DateTime WC_FINALS_START = new DateTime(2026, 6, 25);

    public ScheduledFetchSmartResultsFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<ScheduledFetchSmartResultsFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("ScheduledFetchSmartResults")]
    public async Task Run(
        [TimerTrigger("*/5 * * * *")] TimerInfo timer) // Every 5 minutes
    {
        var now = DateTime.UtcNow;

        try
        {
            // Check if database is empty - if so, nothing to process yet
            var allMatches = await _matchRepository.GetAllAsync();
            if (allMatches.Count == 0)
            {
                _logger.LogInformation("📊 No matches in database yet - skipping results processing");
                return;
            }

            if (now < WC_FULL_LOAD_START)
            {
                // PHASE 1: LA LIGA results
                await FetchLaLigaResults(now);
            }
            else if (now >= WC_FULL_LOAD_START && now <= WC_FULL_LOAD_END)
            {
                // PHASE 2: Waiting for World Cup (no results yet)
                _logger.LogInformation("⏳ PHASE 2: Loading World Cup - no results yet");
            }
            else if (now >= WC_LIVE_START)
            {
                // PHASE 3: World Cup results
                await FetchWorldCupResults(now);
            }

            _logger.LogInformation("✅ ScheduledFetchSmartResults completed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("⚠️ Function running late!");
        }
    }

    /// <summary>
    /// Fetch La Liga results for completed matches
    /// </summary>
    private async Task FetchLaLigaResults(DateTime now)
    {
        try
        {
            var allMatches = await _matchRepository.GetAllAsync();

            var laLigaMatches = allMatches
                .Where(m => m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            var toCheck = laLigaMatches
                .Where(m => m.Status != "FINISHED"
                    && m.KickoffAtUtc <= now.AddMinutes(-BufferMinutes))
                .ToList();

            if (toCheck.Count == 0)
            {
                return;
            }

            _logger.LogInformation("📊 La Liga: Checking {Count} for results", toCheck.Count);

            var updated = await _footballDataService.GetSpanishLaLigaMatches();
            int count = 0;

            foreach (var match in toCheck)
            {
                var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                if (upd == null) continue;

                if (upd.Status == "FINISHED" && upd.HomeScoreFinal.HasValue && upd.AwayScoreFinal.HasValue)
                {
                    _logger.LogInformation(
                        "📊 FINISHED: {HomeTeam} {H}-{A} {AwayTeam}",
                        upd.HomeTeam, upd.HomeScoreFinal, upd.AwayScoreFinal, upd.AwayTeam);

                    await _matchRepository.UpsertAsync(upd);
                    await ProcessPredictions(upd);
                    count++;
                }
                else if (upd.Status == "LIVE" || upd.Status == "IN_PLAY")
                {
                    await _matchRepository.UpsertAsync(upd);
                }
            }

            _logger.LogInformation("✅ La Liga: {Count} finished", count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Fetch World Cup results for completed matches
    /// </summary>
    private async Task FetchWorldCupResults(DateTime now)
    {
        try
        {
            var allMatches = await _matchRepository.GetAllAsync();

            var wcMatches = allMatches
                .Where(m => (m.TournamentId?.Contains("2026", StringComparison.OrdinalIgnoreCase) ?? false) ||
                           (m.Stage?.Contains("GROUP", StringComparison.OrdinalIgnoreCase) ?? false) ||
                           (m.Stage?.Contains("ROUND", StringComparison.OrdinalIgnoreCase) ?? false) ||
                           (m.Stage?.Contains("SEMI", StringComparison.OrdinalIgnoreCase) ?? false) ||
                           (m.Stage?.Contains("FINAL", StringComparison.OrdinalIgnoreCase) ?? false))
                .ToList();

            var toCheck = wcMatches
                .Where(m => m.Status != "FINISHED"
                    && m.KickoffAtUtc <= now.AddMinutes(-BufferMinutes))
                .ToList();

            if (toCheck.Count == 0)
            {
                return;
            }

            _logger.LogInformation("🌍 World Cup: Checking {Count} for results", toCheck.Count);

            var updated = await _footballDataService.GetWorldCupMatches();
            int count = 0;

            foreach (var match in toCheck)
            {
                var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                if (upd == null) continue;

                if (upd.Status == "FINISHED" && upd.HomeScoreFinal.HasValue && upd.AwayScoreFinal.HasValue)
                {
                    _logger.LogInformation(
                        "🌍 FINISHED: {HomeTeam} {H}-{A} {AwayTeam} ({Stage})",
                        upd.HomeTeam, upd.HomeScoreFinal, upd.AwayScoreFinal, upd.AwayTeam,
                        upd.Stage);

                    await _matchRepository.UpsertAsync(upd);
                    await ProcessPredictions(upd);
                    count++;
                }
                else if (upd.Status == "LIVE" || upd.Status == "IN_PLAY")
                {
                    await _matchRepository.UpsertAsync(upd);
                }
            }

            _logger.LogInformation("✅ World Cup: {Count} finished", count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// Process predictions and award points based on match result
    /// Calculates points: 3 (exact), 1 (correct winner), 0 (wrong)
    /// Bonuses: +5 for Colombia matches (World Cup) or Barcelona/Real Madrid (La Liga demo)
    /// </summary>
    private async Task ProcessPredictions(Models.Match match)
    {
        try
        {
            _logger.LogInformation("⚙️ Processing predictions for {MatchId}: {HomeTeam} vs {AwayTeam}",
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
