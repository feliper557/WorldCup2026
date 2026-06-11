using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Functions;

/// <summary>
/// Function para obtener el ranking de participantes
/// Calcula puntos dinámicamente sumando predicciones de partidos + predicción de campeón (20 pts)
/// </summary>
public class RankingFunction
{
    private readonly IUserRepository _userRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IChampionPredictionRepository _championRepository;
    private readonly ILogger<RankingFunction> _logger;

    public RankingFunction(
        IUserRepository userRepository,
        IPredictionRepository predictionRepository,
        IChampionPredictionRepository championRepository,
        ILogger<RankingFunction> logger)
    {
        _userRepository = userRepository;
        _predictionRepository = predictionRepository;
        _championRepository = championRepository;
        _logger = logger;
    }

    [Function("GetRanking")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "ranking")]
        HttpRequestData req)
    {
        _logger.LogInformation("GetRanking called");

        try
        {
            // 3 roundtrips secuenciales — NO usar Task.WhenAll, los repos comparten DbContext.
            var users = await _userRepository.GetLeaderboardAsync(limit: 1000);
            var aggregates = await _predictionRepository.GetAggregatedByUserAsync();
            var championPredictions = await _championRepository.GetAllAsync();

            // Puntos de campeón por userId (solo quienes acertaron tienen PointsAwarded > 0)
            var championPoints = championPredictions
                .Where(cp => cp.PointsAwarded > 0)
                .ToDictionary(cp => cp.UserId, cp => cp.PointsAwarded);

            var ranking = users
                .Select(user =>
                {
                    aggregates.TryGetValue(user.Id, out var agg);
                    championPoints.TryGetValue(user.Id, out var champPts);
                    return new
                    {
                        user.Id,
                        user.Email,
                        user.DisplayName,
                        TotalPoints = (agg?.TotalPoints ?? 0) + champPts,
                        TotalPredictions = agg?.TotalPredictions ?? 0,
                        ExactScores = agg?.ExactScores ?? 0,
                        CorrectWinners = agg?.CorrectWinners ?? 0,
                        ChampionPoints = champPts,
                        user.LeaderboardRank,
                    };
                })
                .OrderByDescending(u => u.TotalPoints)
                .Select((u, index) => new
                {
                    u.Id,
                    u.Email,
                    u.DisplayName,
                    u.TotalPoints,
                    u.TotalPredictions,
                    u.ExactScores,
                    u.CorrectWinners,
                    u.LeaderboardRank,
                    Rank = index + 1,
                })
                .ToList();

            _logger.LogInformation("Ranking calculated for {Count} users", ranking.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            // Cache corto: el ranking solo cambia tras sync-results.
            response.Headers.Add("Cache-Control", "public, max-age=30");
            await response.WriteAsJsonAsync(ranking);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo ranking");
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new { error = ex.Message });
            return response;
        }
    }
}
