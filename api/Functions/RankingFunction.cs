using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Functions;

/// <summary>
/// Function para obtener el ranking de participantes
/// Retorna lista de usuarios ordenada por puntos
/// </summary>
public class RankingFunction
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<RankingFunction> _logger;

    public RankingFunction(IUserRepository userRepository, ILogger<RankingFunction> logger)
    {
        _userRepository = userRepository;
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
            // Obtener todos los usuarios activos y ordenar por puntos
            var users = await _userRepository.GetLeaderboardAsync(limit: 1000);

            // Mapear a respuesta
            var ranking = users.Select((u, index) => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.TotalPoints,
                u.TotalPredictions,
                u.CorrectPredictions,
                u.AccuracyPercentage,
                u.LeaderboardRank,
                Position = index + 1,
                exactScores = u.CorrectPredictions // Para compatibilidad con frontend
            }).ToList();

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
