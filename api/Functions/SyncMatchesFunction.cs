using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Extensions;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class SyncMatchesFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<SyncMatchesFunction> _logger;

    public SyncMatchesFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        ILogger<SyncMatchesFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("SyncMatches")]
    [OpenApiOperation(
        operationId: "SyncMatches",
        tags: new[] { "Admin" },
        Summary = "Sincronizar partidos desde Football-Data",
        Description = "Carga/actualiza los partidos desde la API de Football-Data. Parámetros: competition (laliga|worldcup), dateFrom (YYYY-MM-DD), dateTo (YYYY-MM-DD)",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: System.Net.HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(SyncResponse),
        Description = "Resultado de la sincronización")]
    [OpenApiResponseWithBody(
        statusCode: System.Net.HttpStatusCode.InternalServerError,
        contentType: "application/json",
        bodyType: typeof(SyncResponse),
        Description = "Error durante la sincronización")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, new[] { "post", "get" }, Route = "sync-matches")] HttpRequestData req)
    {
        try
        {
            _logger.LogInformation("🔄 SyncMatches triggered");

            // Read query parameters
            var competition = req.Query["competition"] ?? "laliga";
            var dateFromStr = req.Query["dateFrom"];
            var dateToStr = req.Query["dateTo"];

            // Parse dates
            DateTime? dateFrom = null;
            DateTime? dateTo = null;

            if (!string.IsNullOrEmpty(dateFromStr) && DateTime.TryParse(dateFromStr, out var from))
                dateFrom = from;

            if (!string.IsNullOrEmpty(dateToStr) && DateTime.TryParse(dateToStr, out var to))
                dateTo = to;

            _logger.LogInformation("📥 Params: competition={Competition}, dateFrom={DateFrom}, dateTo={DateTo}",
                competition, dateFromStr, dateToStr);

            // Fetch matches based on competition
            List<Match> matches = competition == "worldcup"
                ? await _footballDataService.GetWorldCupMatches(dateFrom, dateTo)
                : await _footballDataService.GetSpanishLaLigaMatches(dateFrom, dateTo);

            int syncedCount = 0;
            foreach (var match in matches)
            {
                // Convert match time from UTC to Colombia time (UTC-5)
                var colombiaMatch = match;
                colombiaMatch.MatchDate = match.MatchDate.AddHours(-5);

                await _matchRepository.UpsertAsync(colombiaMatch.ToEntity());
                syncedCount++;
            }

            _logger.LogInformation("✅ Synced {Count} matches from {Competition}", syncedCount, competition);
            var response = req.CreateResponse(System.Net.HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new SyncResponse(
                true,
                $"✅ Se sincronizaron {syncedCount} partidos de {(competition == "worldcup" ? "Mundial 2026" : "La Liga")}",
                syncedCount
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error: {Message}", ex.Message);
            var response = req.CreateResponse(System.Net.HttpStatusCode.InternalServerError);
            await response.WriteAsJsonAsync(new SyncResponse(
                false,
                $"❌ Error: {ex.Message}",
                0
            ));
            return response;
        }
    }

    public record SyncResponse(bool Success, string Message, int MatchesCount);
}
