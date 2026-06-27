using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Admin endpoint para corregir manualmente el marcador de un partido y recalcular puntos.
/// POST /api/mgmt/set-match-score/{matchId}
/// Body: { "homeScore": 4, "awayScore": 0 }
/// </summary>
public class AdminSetMatchScoreFunction
{
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly IScoringService _scoringService;
    private readonly ILogger<AdminSetMatchScoreFunction> _logger;

    public AdminSetMatchScoreFunction(
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        IScoringService scoringService,
        ILogger<AdminSetMatchScoreFunction> logger)
    {
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _scoringService = scoringService;
        _logger = logger;
    }

    private record ScoreRequest(int HomeScore, int AwayScore);

    [Function("AdminSetMatchScore")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/set-match-score/{matchId}")]
        HttpRequestData req,
        string matchId)
    {
        var body = await req.ReadFromJsonAsync<ScoreRequest>();
        if (body == null)
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteAsJsonAsync(new { error = "Body requerido: { homeScore, awayScore }" });
            return bad;
        }

        // Buscar partido en BD por Id o ExternalId
        var allMatches = await _matchRepository.GetAllAsync();
        var dbMatch = allMatches.FirstOrDefault(m => m.Id == matchId)
            ?? allMatches.FirstOrDefault(m => m.ExternalId.HasValue && m.ExternalId.Value.ToString() == matchId);

        if (dbMatch == null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteAsJsonAsync(new { error = $"Partido '{matchId}' no encontrado en la base de datos" });
            return notFound;
        }

        _logger.LogInformation("Corrección manual: {Home} vs {Away} | Anterior={PH}-{PA} → Nuevo={NH}-{NA}",
            dbMatch.HomeTeam, dbMatch.AwayTeam,
            dbMatch.HomeScore, dbMatch.AwayScore,
            body.HomeScore, body.AwayScore);

        var prevHome = dbMatch.HomeScore;
        var prevAway = dbMatch.AwayScore;

        // Actualizar score y asegurar status FINISHED
        dbMatch.HomeScore = body.HomeScore;
        dbMatch.AwayScore = body.AwayScore;
        dbMatch.Status = "FINISHED";
        await _matchRepository.UpsertAsync(dbMatch);

        // Recalcular puntos de todas las predicciones
        var matchModel = new Models.Match
        {
            Id = dbMatch.Id,
            HomeTeam = dbMatch.HomeTeam ?? string.Empty,
            AwayTeam = dbMatch.AwayTeam ?? string.Empty,
            Stage = dbMatch.Stage ?? string.Empty,
            HomeScoreFinal = body.HomeScore,
            AwayScoreFinal = body.AwayScore,
            Status = "FINISHED",
            MatchDate = dbMatch.MatchDate,
        };

        var predictions = await _predictionRepository.GetByMatchIdAsync(dbMatch.Id);
        var homeUpper = (dbMatch.HomeTeam ?? string.Empty).ToUpper();
        var awayUpper = (dbMatch.AwayTeam ?? string.Empty).ToUpper();
        var hasBonus = homeUpper.Contains("COLOMBIA") || awayUpper.Contains("COLOMBIA");

        int updated = 0;
        foreach (var prediction in predictions)
        {
            int basePoints = _scoringService.CalculatePoints(matchModel, new Models.Prediction
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

            _logger.LogInformation("  userId={UserId} pred={PH}-{PA} pts={Pts}",
                prediction.UserId, prediction.PredictedHomeScore, prediction.PredictedAwayScore, totalPoints);
            updated++;
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            message = "✅ Marcador corregido y puntos recalculados",
            matchId = dbMatch.Id,
            homeTeam = dbMatch.HomeTeam,
            awayTeam = dbMatch.AwayTeam,
            previousScore = $"{prevHome}-{prevAway}",
            newScore = $"{body.HomeScore}-{body.AwayScore}",
            predictionsUpdated = updated,
        });
        return response;
    }
}
