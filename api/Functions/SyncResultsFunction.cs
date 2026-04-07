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
            // 1. Are NOT finished yet
            // 2. Have passed 105 minutes since kickoff (in Colombia time)
            var matchesToSync = allMatches
                .Where(m => m.Status?.Equals("FINISHED", StringComparison.OrdinalIgnoreCase) != true) // Not finished
                .Where(m => m.MatchDate.AddMinutes(BufferMinutes) <= colombiaTime) // 105+ minutes passed
                .ToList();

            if (matchesToSync.Count == 0)
            {
                _logger.LogInformation("No matches eligible for sync (all finished or not yet 105min)");
                var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
                await response.WriteAsJsonAsync(new { message = "No matches to sync", updatedCount = 0 });
                return response;
            }

            // Check La Liga (REGULAR stage)
            var laLigaMatches = matchesToSync
                .Where(m => m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) == true)
                .ToList();

            if (laLigaMatches.Count > 0)
            {
                var updated = await _footballDataService.GetSpanishLaLigaMatches();
                foreach (var match in laLigaMatches)
                {
                    var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                    if (upd?.Status == "FINISHED" && upd.HomeScoreFinal.HasValue && upd.AwayScoreFinal.HasValue)
                    {
                        await _matchRepository.UpsertAsync(upd.ToEntity());
                        await ProcessPredictions(upd);
                        updatedCount++;
                    }
                }
            }

            // Check World Cup 2026 matches (GROUP_STAGE, ROUND_OF_16, QUARTER_FINALS, SEMI_FINALS, FINAL)
            var worldCupMatches = matchesToSync
                .Where(m => !m.Stage?.Contains("REGULAR", StringComparison.OrdinalIgnoreCase) ?? true) // Exclude La Liga
                .ToList();

            if (worldCupMatches.Count > 0)
            {
                var updated = await _footballDataService.GetWorldCupMatches();
                foreach (var match in worldCupMatches)
                {
                    var upd = updated.FirstOrDefault(m => m.Id == match.Id);
                    if (upd?.Status == "FINISHED" && upd.HomeScoreFinal.HasValue && upd.AwayScoreFinal.HasValue)
                    {
                        await _matchRepository.UpsertAsync(upd.ToEntity());
                        await ProcessPredictions(upd);
                        updatedCount++;
                    }
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
