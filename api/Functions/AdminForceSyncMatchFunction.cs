using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Admin endpoint to force-sync a single match by its football-data.org external ID.
/// Útil cuando el sync automático no actualiza un partido por mismatch de IDs.
/// POST /api/mgmt/force-sync-match/{externalId}
/// </summary>
public class AdminForceSyncMatchFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<AdminForceSyncMatchFunction> _logger;

    public AdminForceSyncMatchFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<AdminForceSyncMatchFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    [Function("AdminForceSyncMatch")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/force-sync-match/{externalId}")]
        HttpRequestData req,
        string externalId)
    {
        _logger.LogInformation("Force-sync match externalId={ExternalId}", externalId);

        // 1. Obtener partido desde football-data.org por ID externo
        var apiMatch = await _footballDataService.GetMatchDetailsAsync(externalId);
        if (apiMatch == null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteAsJsonAsync(new { error = $"Partido {externalId} no encontrado en football-data.org" });
            return notFound;
        }

        _logger.LogInformation("API returned: {Home} vs {Away} | Status={Status} | Score={H}-{A}",
            apiMatch.HomeTeam, apiMatch.AwayTeam, apiMatch.Status, apiMatch.HomeScoreFinal, apiMatch.AwayScoreFinal);

        // 2. Buscar en BD por ExternalId o por Id=="externalId"
        var allMatches = await _matchRepository.GetAllAsync();
        var dbMatch = allMatches.FirstOrDefault(m =>
            m.ExternalId.HasValue && m.ExternalId.Value.ToString() == externalId)
            ?? allMatches.FirstOrDefault(m => m.Id == externalId);

        if (dbMatch == null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteAsJsonAsync(new { error = $"Partido {externalId} no existe en la base de datos" });
            return notFound;
        }

        _logger.LogInformation("DB match found: Id={Id} | Status={Status} | Score={H}-{A}",
            dbMatch.Id, dbMatch.Status, dbMatch.HomeScore, dbMatch.AwayScore);

        // 3. Actualizar score y status
        var prevStatus = dbMatch.Status;
        dbMatch.Status = apiMatch.Status;
        dbMatch.HomeScore = apiMatch.HomeScoreFinal;
        dbMatch.AwayScore = apiMatch.AwayScoreFinal;

        await _matchRepository.UpsertAsync(dbMatch);

        // 4. Calcular puntos siempre que haya score (recálculo forzado)
        int predictionsUpdated = 0;
        if (apiMatch.HomeScoreFinal.HasValue && apiMatch.AwayScoreFinal.HasValue)
        {
            apiMatch.Id = dbMatch.Id; // usar ID interno para localizar predicciones en BD
            predictionsUpdated = await ProcessPredictions(apiMatch);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            message = "✅ Partido actualizado correctamente",
            matchId = dbMatch.Id,
            externalId,
            homeTeam = apiMatch.HomeTeam,
            awayTeam = apiMatch.AwayTeam,
            previousStatus = prevStatus,
            newStatus = apiMatch.Status,
            homeScore = apiMatch.HomeScoreFinal,
            awayScore = apiMatch.AwayScoreFinal,
            predictionsUpdated,
        });
        return response;
    }

    private async Task<int> ProcessPredictions(Models.Match match)
    {
        int count = 0;
        try
        {
            var predictions = await _predictionRepository.GetByMatchIdAsync(match.Id);
            if (!predictions.Any()) return 0;

            var homeUpper = match.HomeTeam?.ToUpper() ?? string.Empty;
            var awayUpper = match.AwayTeam?.ToUpper() ?? string.Empty;
            var hasBonus = homeUpper.Contains("COLOMBIA") || awayUpper.Contains("COLOMBIA");

            foreach (var prediction in predictions)
            {
                int basePoints = _scoringService.CalculatePoints(match, new Models.Prediction
                {
                    HomeScorePred = prediction.PredictedHomeScore,
                    AwayScorePred = prediction.PredictedAwayScore
                });
                int totalPoints = (basePoints == 3 && hasBonus) ? 5 : basePoints;

                await _predictionRepository.UpdateAsync(new Infrastructure.Entities.PredictionEntity
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
                });

                _logger.LogInformation("  userId={UserId} pred={PH}-{PA} real={RH}-{RA} pts={Pts}",
                    prediction.UserId, prediction.PredictedHomeScore, prediction.PredictedAwayScore,
                    match.HomeScoreFinal, match.AwayScoreFinal, totalPoints);
                count++;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing predictions for match {MatchId}", match.Id);
        }
        return count;
    }
}
