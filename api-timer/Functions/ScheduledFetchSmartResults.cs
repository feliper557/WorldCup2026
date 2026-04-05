using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Extensions;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace ApiTimer.Functions;

/// <summary>
/// UNIFIED SMART Function - Fetch results with same logic
/// Auto-switches La Liga ↔ World Cup based on date
/// Runs every 5 minutes
/// Calculates points: 3 (exact), 1 (correct winner), 0 (wrong)
/// Bonuses: +5 for Colombia (World Cup) or Barcelona/Real Madrid (La Liga demo)
/// </summary>
public class ScheduledFetchSmartResults
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<ScheduledFetchSmartResults> _logger;

    private const int BufferMinutes = 105;

    private static readonly DateTime WC_FULL_LOAD_START = new DateTime(2026, 6, 1);
    private static readonly DateTime WC_FULL_LOAD_END = new DateTime(2026, 6, 2, 23, 59, 59);
    private static readonly DateTime WC_MATCHES_START = new DateTime(2026, 6, 11);
    private static readonly DateTime WC_MATCHES_END = new DateTime(2026, 6, 27);
    private static readonly DateTime WC_LIVE_START = new DateTime(2026, 6, 10);
    private static readonly DateTime WC_FINALS_START = new DateTime(2026, 6, 25);

    public ScheduledFetchSmartResults(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<ScheduledFetchSmartResults> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("ScheduledFetchSmartResults")]
    public async Task Run(
        [TimerTrigger("*/5 * * * *")] TimerInfo timer)
    {
        var now = DateTime.UtcNow;

        try
        {
            // Check if database is empty - if so, nothing to process yet
            var allMatches = await _matchRepository.GetAllAsync();
            if (allMatches.Count() == 0)
            {
                _logger.LogInformation("📊 No matches in database yet - skipping results processing");
                return;
            }

            if (now < WC_FULL_LOAD_START)
            {
                await FetchLaLigaResults(now);
            }
            else if (now >= WC_FULL_LOAD_START && now <= WC_FULL_LOAD_END)
            {
                _logger.LogInformation("⏳ PHASE 2: Loading World Cup - no results yet");
            }
            else if (now >= WC_LIVE_START)
            {
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
                    && m.MatchDate <= now.AddMinutes(-BufferMinutes))
                .ToList();

            if (toCheck.Count() == 0)
            {
                return;
            }

            _logger.LogInformation("📊 La Liga: Checking {Count} for results", toCheck.Count());

            var updated = await _footballDataService.GetSpanishLaLigaMatches();
            int count = 0;

            foreach (var match in toCheck)
            {
                var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                if (upd == null) continue;

                if (upd.Status == "FINISHED" && upd.HomeScore.HasValue && upd.AwayScore.HasValue)
                {
                    _logger.LogInformation(
                        "📊 FINISHED: {HomeTeam} {H}-{A} {AwayTeam}",
                        upd.HomeTeam, upd.HomeScore, upd.AwayScore, upd.AwayTeam);

                    await _matchRepository.UpsertAsync(upd.ToEntity());
                    await ProcessPredictions(upd);
                    count++;
                }
                else if (upd.Status == "LIVE" || upd.Status == "IN_PLAY")
                {
                    await _matchRepository.UpsertAsync(upd.ToEntity());
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
                    && m.MatchDate <= now.AddMinutes(-BufferMinutes))
                .ToList();

            if (toCheck.Count() == 0)
            {
                return;
            }

            _logger.LogInformation("🌍 World Cup: Checking {Count} for results", toCheck.Count());

            var updated = await _footballDataService.GetWorldCupMatches();
            int count = 0;

            foreach (var match in toCheck)
            {
                var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                if (upd == null) continue;

                if (upd.Status == "FINISHED" && upd.HomeScore.HasValue && upd.AwayScore.HasValue)
                {
                    _logger.LogInformation(
                        "🌍 FINISHED: {HomeTeam} {H}-{A} {AwayTeam} ({Stage})",
                        upd.HomeTeam, upd.HomeScore, upd.AwayScore, upd.AwayTeam,
                        upd.Stage);

                    await _matchRepository.UpsertAsync(upd.ToEntity());
                    await ProcessPredictions(upd);
                    count++;
                }
                else if (upd.Status == "LIVE" || upd.Status == "IN_PLAY")
                {
                    await _matchRepository.UpsertAsync(upd.ToEntity());
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

    private async Task ProcessPredictions(WorldCup.Api.Models.Match match)
    {
        try
        {
            _logger.LogInformation("⚙️ Processing predictions for {MatchId}: {HomeTeam} vs {AwayTeam}",
                match.Id, match.HomeTeam, match.AwayTeam);

            var predictions = await _predictionRepository.GetByMatchIdAsync(match.Id);

            if (!predictions.Any())
            {
                _logger.LogInformation("No predictions found for match {MatchId}", match.Id);
                return;
            }

            var isDemo = match.Stage?.ToUpper().Contains("REGULAR") ?? false;
            var bonusTeams = isDemo
                ? new[] { "BARCELONA", "REAL MADRID" }
                : new[] { "COLOMBIA" };

            var hasBonus = bonusTeams.Contains(match.HomeTeam?.ToUpper()) ||
                          bonusTeams.Contains(match.AwayTeam?.ToUpper());

            int processedCount = 0;

            foreach (var prediction in predictions)
            {
                int basePoints = _scoringService.CalculatePoints(match, new WorldCup.Api.Models.Prediction
                {
                    HomeScorePred = prediction.PredictedHomeScore,
                    AwayScorePred = prediction.PredictedAwayScore
                });

                int totalPoints = (basePoints == 3 && hasBonus) ? 5 : basePoints;

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
