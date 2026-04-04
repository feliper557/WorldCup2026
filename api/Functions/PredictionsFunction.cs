using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.OpenApi.Models;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class PredictionsFunction
{
    private readonly IPredictionRepository _predictions;
    private readonly IMatchRepository _matches;
    private readonly ITimeProviderService _time;

    public PredictionsFunction(
        IPredictionRepository predictions,
        IMatchRepository matches,
        ITimeProviderService time)
    {
        _predictions = predictions;
        _matches = matches;
        _time = time;
    }

    public record PredictionRequest(string MatchId, int Home, int Away);

    [Function("UpsertPrediction")]
    [OpenApiOperation(
        operationId: "UpsertPrediction",
        tags: new[] { "Predictions" },
        Summary = "Crear o actualizar predicción",
        Description = "Permite a un usuario crear o actualizar su predicción para un partido",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiRequestBody(
        contentType: "application/json",
        bodyType: typeof(PredictionRequest),
        Required = true,
        Description = "Datos de la predicción")]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(Prediction),
        Description = "Predicción creada/actualizada")]
    [OpenApiResponseWithoutBody(
        statusCode: HttpStatusCode.Unauthorized,
        Description = "Usuario no autenticado")]
    [OpenApiResponseWithoutBody(
        statusCode: HttpStatusCode.BadRequest,
        Description = "Request inválido")]
    [OpenApiResponseWithoutBody(
        statusCode: HttpStatusCode.NotFound,
        Description = "Partido no encontrado")]
    [OpenApiResponseWithoutBody(
        statusCode: HttpStatusCode.Conflict,
        Description = "Predicción cerrada (partido ya comenzó)")]
    public async Task<HttpResponseData> UpsertPrediction(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "predictions")] HttpRequestData req)
    {
        // 1. Obtener usuario desde cabeceras de Static Web Apps (ejemplo simplificado)
        var userId = req.Headers.TryGetValues("X-MS-CLIENT-PRINCIPAL-ID", out var vals)
            ? vals.FirstOrDefault()
            : null;

        if (string.IsNullOrEmpty(userId))
        {
            var unauthorized = req.CreateResponse(HttpStatusCode.Unauthorized);
            await unauthorized.WriteStringAsync("Usuario no autenticado.");
            return unauthorized;
        }

        var body = await req.ReadFromJsonAsync<PredictionRequest>();
        if (body is null)
        {
            var bad = req.CreateResponse(HttpStatusCode.BadRequest);
            await bad.WriteStringAsync("Body inválido.");
            return bad;
        }

        // 2. Validar partido
        var match = await _matches.GetByIdAsync(body.MatchId);
        if (match is null)
        {
            var notFound = req.CreateResponse(HttpStatusCode.NotFound);
            await notFound.WriteStringAsync("Partido no encontrado.");
            return notFound;
        }

        // 3. Validar cutoff (1 minuto antes)
        var cutoffUtc = match.KickoffAtUtc.AddMinutes(-1);
        if (_time.UtcNow >= cutoffUtc)
        {
            var closed = req.CreateResponse(HttpStatusCode.Conflict);
            await closed.WriteStringAsync("El pronóstico está cerrado (menos de 1 minuto para iniciar o ya inició).");
            return closed;
        }

        // 4. Guardar/actualizar pronóstico
        var predictionEntity = await _predictions.GetByUserAndMatchAsync(userId, match.Id);

        if (predictionEntity == null)
        {
            predictionEntity = new PredictionEntity
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                MatchId = match.Id,
                CreatedAt = _time.UtcNow
            };
        }

        predictionEntity.PredictedHomeScore = body.Home;
        predictionEntity.PredictedAwayScore = body.Away;
        predictionEntity.UpdatedAt = _time.UtcNow;

        await _predictions.UpsertAsync(predictionEntity);

        // Map to Prediction model
        var prediction = new Prediction
        {
            Id = predictionEntity.Id,
            UserId = predictionEntity.UserId,
            MatchId = predictionEntity.MatchId,
            PredictedHomeScore = predictionEntity.PredictedHomeScore,
            PredictedAwayScore = predictionEntity.PredictedAwayScore,
            PredictedWinner = predictionEntity.PredictedWinner,
            PointsEarned = predictionEntity.PointsEarned,
            CreatedAt = predictionEntity.CreatedAt,
            UpdatedAt = predictionEntity.UpdatedAt
        };

        var ok = req.CreateResponse(HttpStatusCode.OK);
        await ok.WriteAsJsonAsync(prediction);
        return ok;
    }
}
