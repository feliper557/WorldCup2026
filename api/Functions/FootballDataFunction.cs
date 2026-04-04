using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class FootballDataFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<FootballDataFunction> _logger;

    public FootballDataFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        ILogger<FootballDataFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("GetFootballDataFixtures")]
    [OpenApiOperation(
        operationId: "GetFootballDataFixtures",
        tags: new[] { "FootballData" },
        Summary = "Obtener partidos del Mundial 2026",
        Description = "Retorna los partidos del Mundial 2026 desde Football-Data.org",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de partidos del Mundial 2026")]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.InternalServerError,
        contentType: "application/json",
        bodyType: typeof(object),
        Description = "Error del servidor")]
    public async Task<HttpResponseData> GetFootballDataFixtures(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/fixtures")] HttpRequestData req)
    {
        _logger.LogInformation("GetFootballDataFixtures endpoint called");

        try
        {
            var footballDataMatches = await _footballDataService.GetWorldCupMatches();

            if (footballDataMatches.Count > 0)
            {
                _logger.LogInformation("Successfully retrieved {Count} fixtures from Football-Data.org", footballDataMatches.Count);
                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(footballDataMatches);
                return response;
            }

            _logger.LogInformation("Football-Data.org returned 0 matches, falling back to mock data");
            var mockMatches = await _matchRepository.GetAllAsync();
            var mockList = mockMatches.ToList();

            var fallbackResponse = req.CreateResponse(HttpStatusCode.OK);
            await fallbackResponse.WriteAsJsonAsync(mockList);
            return fallbackResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFootballDataFixtures, falling back to mock data");

            try
            {
                var mockMatches = await _matchRepository.GetAllAsync();
                var mockList = mockMatches.ToList();
                var response = req.CreateResponse(HttpStatusCode.OK);
                await response.WriteAsJsonAsync(mockList);
                return response;
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError(fallbackEx, "Fallback to mock data also failed");
                var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
                await errorResponse.WriteAsJsonAsync(new { error = $"Football-Data.org: {ex.Message}. Fallback failed: {fallbackEx.Message}" });
                return errorResponse;
            }
        }
    }

    [Function("GetFootballDataResults")]
    [OpenApiOperation(
        operationId: "GetFootballDataResults",
        tags: new[] { "FootballData" },
        Summary = "Obtener resultados finalizados del Mundial 2026",
        Description = "Retorna solo los partidos finalizados con sus resultados desde Football-Data.org",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de partidos finalizados con resultados")]
    public async Task<HttpResponseData> GetFootballDataResults(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/results")] HttpRequestData req)
    {
        _logger.LogInformation("GetFootballDataResults endpoint called");

        try
        {
            var allMatches = await _footballDataService.GetWorldCupMatches();

            var results = allMatches
                .Where(m => m.Status == "FINISHED")
                .OrderByDescending(m => m.KickoffAtUtc)
                .ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(results);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFootballDataResults");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = ex.Message });
            return errorResponse;
        }
    }

    [Function("GetFootballDataLive")]
    [OpenApiOperation(
        operationId: "GetFootballDataLive",
        tags: new[] { "FootballData" },
        Summary = "Obtener partidos en vivo del Mundial 2026",
        Description = "Retorna los partidos que están en vivo actualmente desde Football-Data.org",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de partidos en vivo")]
    public async Task<HttpResponseData> GetFootballDataLive(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/live")] HttpRequestData req)
    {
        _logger.LogInformation("GetFootballDataLive endpoint called");

        try
        {
            var allMatches = await _footballDataService.GetWorldCupMatches();

            var liveMatches = allMatches
                .Where(m => m.Status == "LIVE" || m.Status == "IN_PLAY")
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(liveMatches);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFootballDataLive");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = ex.Message });
            return errorResponse;
        }
    }

    [Function("GetFootballDataUpcoming")]
    [OpenApiOperation(
        operationId: "GetFootballDataUpcoming",
        tags: new[] { "FootballData" },
        Summary = "Obtener próximos partidos del Mundial 2026",
        Description = "Retorna los partidos próximos a jugar desde Football-Data.org",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de próximos partidos")]
    public async Task<HttpResponseData> GetFootballDataUpcoming(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/upcoming")] HttpRequestData req)
    {
        _logger.LogInformation("GetFootballDataUpcoming endpoint called");

        try
        {
            var allMatches = await _footballDataService.GetWorldCupMatches();

            var upcomingMatches = allMatches
                .Where(m => m.Status == "SCHEDULED" || m.Status == "TIMED")
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(upcomingMatches);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFootballDataUpcoming");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = ex.Message });
            return errorResponse;
        }
    }

    [Function("GetFootballDataMatch")]
    [OpenApiOperation(
        operationId: "GetFootballDataMatch",
        tags: new[] { "FootballData" },
        Summary = "Obtener detalles de un partido específico",
        Description = "Retorna información detallada de un partido desde Football-Data.org",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiParameter(
        name: "matchId",
        In = ParameterLocation.Path,
        Required = true,
        Type = typeof(string),
        Description = "ID del partido en Football-Data.org")]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(Match),
        Description = "Detalles del partido")]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.NotFound,
        contentType: "application/json",
        bodyType: typeof(object),
        Description = "Partido no encontrado")]
    public async Task<HttpResponseData> GetFootballDataMatch(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/match/{matchId}")] HttpRequestData req,
        string matchId)
    {
        _logger.LogInformation("GetFootballDataMatch endpoint called for match: {MatchId}", matchId);

        try
        {
            var match = await _footballDataService.GetMatchDetailsAsync(matchId);

            if (match == null)
            {
                var notFoundResponse = req.CreateResponse(HttpStatusCode.NotFound);
                await notFoundResponse.WriteAsJsonAsync(new { error = "Partido no encontrado" });
                return notFoundResponse;
            }

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(match);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFootballDataMatch");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = ex.Message });
            return errorResponse;
        }
    }

    [Function("GetFootballDataLaLiga")]
    [OpenApiOperation(
        operationId: "GetFootballDataLaLiga",
        tags: new[] { "FootballData" },
        Summary = "Obtener partidos de La Liga - Primera División España",
        Description = "Retorna los partidos de La Liga - Primera División España desde Football-Data.org (datos reales, sin mock)",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de partidos de La Liga - Primera División España")]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.InternalServerError,
        contentType: "application/json",
        bodyType: typeof(object),
        Description = "Error del servidor o API no disponible")]
    public async Task<HttpResponseData> GetFootballDataLaLiga(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/laliga")] HttpRequestData req)
    {
        _logger.LogInformation("GetFootballDataLaLiga endpoint called");

        try
        {
            var laLigaMatches = await _footballDataService.GetSpanishLaLigaMatches();
            _logger.LogInformation("Successfully retrieved {Count} matches from La Liga", laLigaMatches.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(laLigaMatches);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving La Liga matches from Football-Data.org");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = $"Failed to fetch La Liga data: {ex.Message}" });
            return errorResponse;
        }
    }

    [Function("GetFootballDataLaLigaResults")]
    [OpenApiOperation(
        operationId: "GetFootballDataLaLigaResults",
        tags: new[] { "FootballData" },
        Summary = "Obtener resultados finalizados de La Liga",
        Description = "Retorna solo los partidos finalizados con resultados de La Liga - Primera División España",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de resultados finalizados de La Liga")]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.InternalServerError,
        contentType: "application/json",
        bodyType: typeof(object),
        Description = "Error del servidor o API no disponible")]
    public async Task<HttpResponseData> GetFootballDataLaLigaResults(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "footballdata/laliga/results")] HttpRequestData req)
    {
        _logger.LogInformation("GetFootballDataLaLigaResults endpoint called");

        try
        {
            var allMatches = await _footballDataService.GetSpanishLaLigaMatches();

            var results = allMatches
                .Where(m => m.Status == "FINISHED")
                .OrderByDescending(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation("Successfully retrieved {Count} finished matches from La Liga", results.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(results);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving La Liga results from Football-Data.org");
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await errorResponse.WriteAsJsonAsync(new { error = $"Failed to fetch La Liga results: {ex.Message}" });
            return errorResponse;
        }
    }
}
