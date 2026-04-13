using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Functions;

/// <summary>
/// Function para obtener el ranking de participantes
/// Calcula puntos dinámicamente sumando todas las predicciones
/// Retorna lista de usuarios ordenada por puntos totales
/// </summary>
public class RankingFunction
{
    private readonly IUserRepository _userRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly ILogger<RankingFunction> _logger;

    public RankingFunction(
        IUserRepository userRepository,
        IPredictionRepository predictionRepository,
        ILogger<RankingFunction> logger)
    {
        _userRepository = userRepository;
        _predictionRepository = predictionRepository;
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
            // Obtener todos los usuarios activos
            var users = await _userRepository.GetLeaderboardAsync(limit: 1000);

            // Calcular puntos dinámicamente para cada usuario
            var usersWithCalculatedPoints = new List<dynamic>();

            foreach (var user in users)
            {
                var predictions = await _predictionRepository.GetByUserIdAsync(user.Id);

                // Calcular todo dinámicamente desde predicciones
                int totalPoints    = predictions.Sum(p => p.PointsEarned);
                int totalPreds     = predictions.Count();
                int exactScores    = predictions.Count(p => p.PointsEarned >= 3); // 3 pts = exacto, 5 = exacto + bonus
                int correctWinners = predictions.Count(p => p.PointsEarned == 1); // 1 pt = acertó ganador

                usersWithCalculatedPoints.Add(new
                {
                    user.Id,
                    user.Email,
                    user.DisplayName,
                    TotalPoints    = totalPoints,
                    TotalPredictions = totalPreds,
                    ExactScores    = exactScores,
                    CorrectWinners = correctWinners,
                    user.LeaderboardRank,
                });
            }

            // Ordenar por puntos totales (descendente)
            var ranking = usersWithCalculatedPoints
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
