using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class AdminApplyChampionFunction
{
    private const int ChampionPoints = 20;

    private readonly IChampionPredictionRepository _championRepo;
    private readonly JwtService _jwtService;
    private readonly ILogger<AdminApplyChampionFunction> _logger;

    public AdminApplyChampionFunction(
        IChampionPredictionRepository championRepo,
        JwtService jwtService,
        ILogger<AdminApplyChampionFunction> logger)
    {
        _championRepo = championRepo;
        _jwtService = jwtService;
        _logger = logger;
    }

    [Function("AdminApplyChampion")]
    public async Task<HttpResponseData> ApplyChampion(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/apply-champion")]
        HttpRequestData req)
    {
        _logger.LogInformation("AdminApplyChampion called");

        try
        {
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            if (string.IsNullOrEmpty(token))
                return Error(req, "No autenticado", HttpStatusCode.Unauthorized);

            var principal = _jwtService.ValidateToken(token);
            if (_jwtService.ExtractRole(principal) != "admin")
                return Error(req, "Acceso denegado", HttpStatusCode.Forbidden);

            var body = await req.ReadFromJsonAsync<ApplyChampionRequest>();
            if (string.IsNullOrWhiteSpace(body?.Champion))
                return Error(req, "champion es requerido", HttpStatusCode.BadRequest);

            var champion = body.Champion.Trim();

            var allPredictions = (await _championRepo.GetAllAsync()).ToList();
            var details = new List<ChampionAwardDetail>();
            int winners = 0;

            foreach (var prediction in allPredictions)
            {
                bool isCorrect = prediction.Team.Equals(champion, StringComparison.OrdinalIgnoreCase);
                int points = isCorrect ? ChampionPoints : 0;

                prediction.IsCorrect = isCorrect;
                prediction.PointsAwarded = points;
                await _championRepo.UpdateAsync(prediction);

                if (isCorrect) winners++;

                details.Add(new ChampionAwardDetail(
                    UserId: prediction.UserId,
                    Email: "",
                    DisplayName: "",
                    PredictedTeam: prediction.Team,
                    IsCorrect: isCorrect,
                    PointsAwarded: points
                ));

                _logger.LogInformation(
                    "ChampionPrediction userId={UserId} team={Team} correct={Correct} points={Points}",
                    prediction.UserId, prediction.Team, isCorrect, points);
            }

            _logger.LogInformation(
                "ApplyChampion complete: champion={Champion}, winners={Winners}/{Total}",
                champion, winners, allPredictions.Count);

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteAsJsonAsync(new ApplyChampionResponse(
                Champion: champion,
                TotalPredictions: allPredictions.Count,
                Winners: winners,
                Details: details,
                Message: winners == 0
                    ? $"Nadie acertó el campeón ({champion})"
                    : $"{winners} usuario{(winners > 1 ? "s" : "")} acertaron el campeón y ganaron {ChampionPoints} puntos"
            ));
            return ok;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en AdminApplyChampion");
            return Error(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private HttpResponseData Error(HttpRequestData req, string message, HttpStatusCode status)
    {
        var response = req.CreateResponse(status);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
