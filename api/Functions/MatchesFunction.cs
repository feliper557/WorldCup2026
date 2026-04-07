using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.OpenApi.Models;
using WorldCup.Api.Extensions;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;

namespace WorldCup.Api.Functions;

public class MatchesFunction
{
    private readonly IMatchRepository _matches;

    public MatchesFunction(IMatchRepository matches)
    {
        _matches = matches;
    }

    [Function("GetMatches")]
    [OpenApiOperation(
        operationId: "GetMatches",
        tags: new[] { "Matches" },
        Summary = "Obtener partidos próximos",
        Description = "Retorna la lista de partidos próximos",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de partidos")]
    [OpenApiResponseWithoutBody(
        statusCode: HttpStatusCode.InternalServerError,
        Description = "Error al obtener partidos")]
    public async Task<HttpResponseData> GetMatches(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "matches")] HttpRequestData req)
    {
        try
        {
            // Get all matches (SCHEDULED, LIVE, FINISHED)
            var entities = await _matches.GetAllAsync();
            var list = entities?.Select(m => m.ToModel()).ToList() ?? new List<Match>();
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(list);
            return response;
        }
        catch (Exception ex)
        {
            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteStringAsync($"Error: {ex.Message}");
            return response;
        }
    }
}
