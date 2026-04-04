using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Attributes;
using Microsoft.Azure.WebJobs.Extensions.OpenApi.Core.Enums;
using Microsoft.OpenApi.Models;
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
        Description = "Retorna la lista de partidos próximos del Mundial 2026",
        Visibility = OpenApiVisibilityType.Important)]
    [OpenApiResponseWithBody(
        statusCode: HttpStatusCode.OK,
        contentType: "application/json",
        bodyType: typeof(List<Match>),
        Description = "Lista de partidos")]
    public async Task<HttpResponseData> GetMatches(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "matches")] HttpRequestData req)
    {
        // TODO: leer querystring from/to, stage, etc.
        var list = await _matches.GetUpcomingAsync();

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(list);
        return response;
    }
}
