using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Extensions;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class SyncResultsFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<SyncResultsFunction> _logger;

    private const int BufferMinutes = 105;

    public SyncResultsFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<SyncResultsFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("SyncResults")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "sync-results")] HttpRequestData req)
    {
        try
        {
            _logger.LogInformation("⏱️ SyncResults triggered");

            // Colombia time (UTC-5)
            var colombiaTime = DateTime.UtcNow.AddHours(-5);
            var allMatches = await _matchRepository.GetAllAsync();
            int updatedCount = 0;

            if (allMatches.Count() == 0)
            {
                _logger.LogInformation("No matches in database");
                var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
                await response.WriteAsJsonAsync(new { message = "No matches to sync", updatedCount = 0 });
                return response;
            }

            // Only sync matches that:
            // 1. Don't have a final score yet (need results from API)
            // 2. Have passed 105 minutes since kickoff (in Colombia time)
            var matchesToSync = allMatches
                .Where(m => m.HomeScore == null || m.AwayScore == null) // No result yet
                .Where(m => m.MatchDate.AddMinutes(BufferMinutes) <= colombiaTime) // 105+ minutes passed
                .ToList();

            _logger.LogInformation("Matches needing scores: {Count} (out of {Total} total)",
                matchesToSync.Count, allMatches.Count());

            if (matchesToSync.Count == 0)
            {
                _logger.LogInformation("No matches eligible for sync (all have scores or not yet 105min)");
                var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
                await response.WriteAsJsonAsync(new { message = "No matches to sync", updatedCount = 0 });
                return response;
            }

            foreach (var m in matchesToSync)
            {
                _logger.LogInformation("  → To sync: {Id} | {Home} vs {Away} | Status={Status} | Score={H}-{A}",
                    m.Id, m.HomeTeam, m.AwayTeam, m.Status, m.HomeScore, m.AwayScore);
            }

            // Check La Liga (REGULAR stage)
            var laLigaMatches = matchesToSync
                .Where(m => m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            if (laLigaMatches.Count > 0)
            {
                _logger.LogInformation("Fetching La Liga results from API for {Count} matches...", laLigaMatches.Count);
                var updated = await _footballDataService.GetSpanishLaLigaMatches();
                _logger.LogInformation("API returned {Count} La Liga matches", updated.Count);

                foreach (var match in laLigaMatches)
                {
                    var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                    if (upd == null)
                    {
                        _logger.LogWarning("  ✗ No API match for DB Id={Id} ({Home} vs {Away})", match.Id, match.HomeTeam, match.AwayTeam);
                        continue;
                    }
                    if (upd.Status != "FINISHED" || !upd.HomeScoreFinal.HasValue || !upd.AwayScoreFinal.HasValue)
                    {
                        _logger.LogInformation("  ~ API match {Id} status={Status} score={H}-{A} (not ready)",
                            upd.Id, upd.Status, upd.HomeScoreFinal, upd.AwayScoreFinal);
                        continue;
                    }

                    _logger.LogInformation("  ✓ Updating {Id}: {Home} {H}-{A} {Away}",
                        upd.Id, upd.HomeTeam, upd.HomeScoreFinal, upd.AwayScoreFinal, upd.AwayTeam);
                    // Convert UTC to Colombia time (UTC-5) to match stored format
                    upd.MatchDate = upd.MatchDate.AddHours(-5);
                    await _matchRepository.UpsertAsync(upd.ToEntity());
                    await ProcessPredictions(upd);
                    updatedCount++;
                }
            }

            // Check World Cup 2026 matches (GROUP_STAGE, ROUND_OF_16, QUARTER_FINALS, SEMI_FINALS, FINAL)
            var worldCupMatches = matchesToSync
                .Where(m => !m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) ?? true) // Exclude La Liga
                .ToList();

            if (worldCupMatches.Count > 0)
            {
                _logger.LogInformation("Fetching World Cup results from API for {Count} matches...", worldCupMatches.Count);
                var updated = await _footballDataService.GetWorldCupMatches();
                _logger.LogInformation("API returned {Count} World Cup matches", updated.Count);

                foreach (var match in worldCupMatches)
                {
                    var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                    if (upd == null)
                    {
                        _logger.LogWarning("  ✗ No API match for DB Id={Id} ({Home} vs {Away})", match.Id, match.HomeTeam, match.AwayTeam);
                        continue;
                    }
                    if (upd.Status != "FINISHED" || !upd.HomeScoreFinal.HasValue || !upd.AwayScoreFinal.HasValue)
                    {
                        _logger.LogInformation("  ~ API match {Id} status={Status} score={H}-{A} (not ready)",
                            upd.Id, upd.Status, upd.HomeScoreFinal, upd.AwayScoreFinal);
                        continue;
                    }

                    _logger.LogInformation("  ✓ Updating {Id}: {Home} {H}-{A} {Away}",
                        upd.Id, upd.HomeTeam, upd.HomeScoreFinal, upd.AwayScoreFinal, upd.AwayTeam);
                    // Convert UTC to Colombia time (UTC-5) to match stored format
                    upd.MatchDate = upd.MatchDate.AddHours(-5);
                    await _matchRepository.UpsertAsync(upd.ToEntity());
                    await ProcessPredictions(upd);
                    updatedCount++;
                }
            }

            _logger.LogInformation("✅ SyncResults completed - Updated {Count} matches", updatedCount);
            var finalResponse = req.CreateResponse(System.Net.HttpStatusCode.OK);
            await finalResponse.WriteAsJsonAsync(new { message = $"✅ Se actualizaron {updatedCount} partidos", updatedCount });
            return finalResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error: {Message}", ex.Message);
            var response = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new { error = ex.Message, updatedCount = 0 });
            return response;
        }
    }

    /// <summary>
    /// Admin endpoint to force-recalculate points for all finished matches with scores.
    /// Useful when predictions were made before scores were synced.
    /// </summary>
    [Function("RecalculatePoints")]
    public async Task<HttpResponseData> RecalculatePoints(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/recalculate-points")] HttpRequestData req)
    {
        _logger.LogInformation("RecalculatePoints triggered");

        // Optional userId filter from query string
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        var filterUserId = query["userId"];

        try
        {
            var allMatches = await _matchRepository.GetAllAsync();
            var finishedMatches = allMatches
                .Where(m => m.Status == "FINISHED" && m.HomeScore.HasValue && m.AwayScore.HasValue)
                .ToList();

            _logger.LogInformation("Found {Count} finished matches with scores", finishedMatches.Count);

            int processedMatches = 0;
            int processedPredictions = 0;

            foreach (var match in finishedMatches)
            {
                var matchModel = new Models.Match
                {
                    Id = match.Id,
                    HomeTeam = match.HomeTeam ?? string.Empty,
                    AwayTeam = match.AwayTeam ?? string.Empty,
                    Stage = match.Stage ?? string.Empty,
                    HomeScoreFinal = match.HomeScore,
                    AwayScoreFinal = match.AwayScore,
                    Status = match.Status,
                    MatchDate = match.MatchDate
                };

                var predictions = (await _predictionRepository.GetByMatchIdAsync(match.Id))
                    .Where(p => string.IsNullOrEmpty(filterUserId) || p.UserId == filterUserId)
                    .ToList();
                if (!predictions.Any()) continue;

                processedMatches++;

                foreach (var prediction in predictions)
                {
                    int basePoints = _scoringService.CalculatePoints(matchModel, new Models.Prediction
                    {
                        HomeScorePred = prediction.PredictedHomeScore,
                        AwayScorePred = prediction.PredictedAwayScore
                    });

                    var isDemo = match.Stage?.ToUpper().Contains("REGULAR") ?? false;
                    var bonusTeams = isDemo ? new[] { "BARCELONA", "REAL MADRID" } : new[] { "COLOMBIA" };
                    var hasBonus = bonusTeams.Contains(match.HomeTeam?.ToUpper()) || bonusTeams.Contains(match.AwayTeam?.ToUpper());
                    int totalPoints = (basePoints == 3 && hasBonus) ? 5 : basePoints;

                    var predictionEntity = new Infrastructure.Entities.PredictionEntity
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
                    processedPredictions++;

                    _logger.LogInformation("  {MatchId} | User={UserId} | Pred={PH}-{PA} | Real={RH}-{RA} | Pts={Pts}",
                        match.Id, prediction.UserId, prediction.PredictedHomeScore, prediction.PredictedAwayScore,
                        match.HomeScore, match.AwayScore, totalPoints);
                }
            }

            _logger.LogInformation("✅ RecalculatePoints done - {Matches} matches, {Predictions} predictions updated",
                processedMatches, processedPredictions);

            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new
            {
                message = $"✅ Recálculo completado",
                matchesProcessed = processedMatches,
                predictionsUpdated = processedPredictions
            });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error recalculating points");
            var response = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new { error = ex.Message });
            return response;
        }
    }

    private async Task ProcessPredictions(Models.Match match)
    {
        try
        {
            var predictions = await _predictionRepository.GetByMatchIdAsync(match.Id);
            if (!predictions.Any()) return;

            var isDemo = match.Stage?.ToUpper().Contains("REGULAR") ?? false;
            var bonusTeams = isDemo ? new[] { "BARCELONA", "REAL MADRID" } : new[] { "COLOMBIA" };
            var hasBonus = bonusTeams.Contains(match.HomeTeam?.ToUpper()) || bonusTeams.Contains(match.AwayTeam?.ToUpper());

            foreach (var prediction in predictions)
            {
                int basePoints = _scoringService.CalculatePoints(match, new Models.Prediction
                {
                    HomeScorePred = prediction.PredictedHomeScore,
                    AwayScorePred = prediction.PredictedAwayScore
                });

                int totalPoints = (basePoints == 3 && hasBonus) ? 5 : basePoints;

                var predictionEntity = new Infrastructure.Entities.PredictionEntity
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
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing predictions: {Message}", ex.Message);
        }
    }
}
