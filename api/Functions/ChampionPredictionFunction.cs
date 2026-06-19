using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class ChampionPredictionFunction
{
    private readonly IChampionPredictionRepository _repo;
    private readonly JwtService _jwtService;
    private readonly ILogger<ChampionPredictionFunction> _logger;

    // Fecha límite: 21 Jun 11:59 PM hora Colombia (UTC-5) = 22 Jun 04:59 AM UTC
    private static readonly DateTime Deadline = new(2026, 6, 22, 4, 59, 59, DateTimeKind.Utc);

    public ChampionPredictionFunction(
        IChampionPredictionRepository repo,
        JwtService jwtService,
        ILogger<ChampionPredictionFunction> logger)
    {
        _repo = repo;
        _jwtService = jwtService;
        _logger = logger;
    }

    [Function("GetChampionPrediction")]
    public async Task<HttpResponseData> GetMyPrediction(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "champion-prediction/me")]
        HttpRequestData req)
    {
        var userId = ExtractUserIdFromJwt(req);
        if (userId == null)
            return ErrorResponse(req, "No autorizado", HttpStatusCode.Unauthorized);

        var prediction = await _repo.GetByUserIdAsync(userId);

        if (prediction == null)
        {
            return req.CreateResponse(HttpStatusCode.NoContent);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            team = prediction.Team,
            flag = prediction.Flag,
            savedAt = prediction.UpdatedAt ?? prediction.CreatedAt
        });
        return response;
    }

    [Function("SaveChampionPrediction")]
    public async Task<HttpResponseData> SavePrediction(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "champion-prediction")]
        HttpRequestData req)
    {
        var userId = ExtractUserIdFromJwt(req);
        if (userId == null)
            return ErrorResponse(req, "No autorizado", HttpStatusCode.Unauthorized);

        if (DateTime.UtcNow >= Deadline)
            return ErrorResponse(req, "El plazo para elegir tu campeón ha cerrado", HttpStatusCode.BadRequest);

        var body = await req.ReadFromJsonAsync<ChampionPredictionRequest>();
        if (body == null || string.IsNullOrWhiteSpace(body.Team) || string.IsNullOrWhiteSpace(body.Flag))
            return ErrorResponse(req, "Equipo y bandera son requeridos", HttpStatusCode.BadRequest);

        var existing = await _repo.GetByUserIdAsync(userId);
        ChampionPredictionEntity saved;

        if (existing != null)
        {
            existing.Team = body.Team.Trim();
            existing.Flag = body.Flag.Trim();
            saved = await _repo.UpdateAsync(existing);
            _logger.LogInformation("Champion prediction updated for user {UserId}: {Team}", userId, body.Team);
        }
        else
        {
            saved = await _repo.CreateAsync(new ChampionPredictionEntity
            {
                UserId = userId,
                Team = body.Team.Trim(),
                Flag = body.Flag.Trim()
            });
            _logger.LogInformation("Champion prediction created for user {UserId}: {Team}", userId, body.Team);
        }

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            team = saved.Team,
            flag = saved.Flag,
            savedAt = saved.UpdatedAt ?? saved.CreatedAt
        });
        return response;
    }

    [Function("DeleteChampionPrediction")]
    public async Task<HttpResponseData> DeletePrediction(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "champion-prediction")]
        HttpRequestData req)
    {
        var userId = ExtractUserIdFromJwt(req);
        if (userId == null)
            return ErrorResponse(req, "No autorizado", HttpStatusCode.Unauthorized);

        if (DateTime.UtcNow >= Deadline)
            return ErrorResponse(req, "No puedes cambiar tu predicción después de la fecha límite", HttpStatusCode.BadRequest);

        await _repo.DeleteByUserIdAsync(userId);
        _logger.LogInformation("Champion prediction deleted for user {UserId}", userId);

        return req.CreateResponse(HttpStatusCode.NoContent);
    }

    private string? ExtractUserIdFromJwt(HttpRequestData req)
    {
        var token = SecureTokenService.ExtractTokenFromRequest(req);
        if (string.IsNullOrEmpty(token))
            return null;

        var principal = _jwtService.ValidateToken(token);
        return _jwtService.ExtractUserId(principal);
    }

    private static HttpResponseData ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }

    private record ChampionPredictionRequest(string Team, string Flag);
}
