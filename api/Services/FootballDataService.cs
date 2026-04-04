using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

/// <summary>
/// Football-Data.org API Service
/// Reliable soccer data API with World Cup competition data
/// Docs: https://docs.football-data.org/general/v4/competition.html
/// Free tier: 10 requests per minute
/// </summary>
public interface IFootballDataService
{
    Task<List<Match>> GetWorldCupMatches();
    Task<List<Match>> GetColombiaMatches();
    Task<List<Match>> GetSpanishLaLigaMatches();
    Task<Match?> GetMatchDetailsAsync(string matchId);
}

public class FootballDataService : IFootballDataService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FootballDataService> _logger;

    // Football-Data.org configuration
    private const string BaseUrl = "https://api.football-data.org/v4";
    
    // World Cup 2026 competition ID in Football-Data.org
    private const string WorldCupCompetitionCode = "WC"; // World Cup code
    private const string SpanishLaLigaCode = "PD"; // La Liga - Primera División España
    private const string ColombiaCompetitionCode = "COL1"; // Liga BetPlay Colombia (not available in free tier)
    
    // Get free API key at: https://www.football-data.org/client/register
    private readonly string _apiKey;

    public FootballDataService(HttpClient httpClient, ILogger<FootballDataService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        
        // Get API key from environment variable
        _apiKey = Environment.GetEnvironmentVariable("FOOTBALL_DATA_API_KEY") 
            ?? throw new InvalidOperationException("FOOTBALL_DATA_API_KEY environment variable not set. Get free key at https://www.football-data.org/client/register");
        
        // Set default headers
        _httpClient.DefaultRequestHeaders.Add("X-Auth-Token", _apiKey);
    }

    /// <summary>
    /// Get all World Cup 2026 matches
    /// </summary>
    public async Task<List<Match>> GetWorldCupMatches()
    {
        try
        {
            var url = $"{BaseUrl}/competitions/{WorldCupCompetitionCode}/matches";
            _logger.LogInformation("Fetching World Cup matches from Football-Data.org: {Url}", url);

            var response = await _httpClient.GetFromJsonAsync<FootballDataMatchesResponse>(
                url,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (response?.Matches == null || response.Matches.Count == 0)
            {
                _logger.LogWarning("No matches found for World Cup from Football-Data.org");
                return new List<Match>();
            }

            _logger.LogInformation("Successfully retrieved {Count} World Cup matches from Football-Data.org",
                response.Matches.Count);

            // Map to internal Match model
            var matches = response.Matches
                .Where(m => m.HomeTeam != null && m.AwayTeam != null)
                .Select(m => m.ToMatch())
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            return matches;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching matches from Football-Data.org");
            throw new InvalidOperationException($"Failed to fetch Football-Data.org matches: {ex.Message}", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON parsing error for Football-Data.org response");
            throw new InvalidOperationException($"Invalid Football-Data.org JSON response: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Get all Liga BetPlay Colombia matches
    /// </summary>
    public async Task<List<Match>> GetColombiaMatches()
    {
        try
        {
            var url = $"{BaseUrl}/competitions/{ColombiaCompetitionCode}/matches";
            _logger.LogInformation("Fetching Colombia matches from Football-Data.org: {Url}", url);

            var response = await _httpClient.GetFromJsonAsync<FootballDataMatchesResponse>(
                url,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (response?.Matches == null || response.Matches.Count == 0)
            {
                _logger.LogWarning("No matches found for Liga BetPlay Colombia");
                return new List<Match>();
            }

            _logger.LogInformation("Retrieved {Count} Colombia matches", response.Matches.Count);

            return response.Matches
                .Where(m => m.HomeTeam != null && m.AwayTeam != null)
                .Select(m => m.ToMatch())
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching Colombia matches");
            throw new InvalidOperationException($"Failed to fetch Colombia matches: {ex.Message}", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON parsing error for Colombia matches response");
            throw new InvalidOperationException($"Invalid response for Colombia matches: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Get all La Liga - Primera División España matches
    /// </summary>
    public async Task<List<Match>> GetSpanishLaLigaMatches()
    {
        try
        {
            var url = $"{BaseUrl}/competitions/{SpanishLaLigaCode}/matches";
            _logger.LogInformation("Fetching La Liga matches from Football-Data.org: {Url}", url);

            var response = await _httpClient.GetFromJsonAsync<FootballDataMatchesResponse>(
                url,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (response?.Matches == null || response.Matches.Count == 0)
            {
                _logger.LogWarning("No matches found for La Liga - Primera División España");
                return new List<Match>();
            }

            _logger.LogInformation("Retrieved {Count} La Liga matches", response.Matches.Count);

            return response.Matches
                .Where(m => m.HomeTeam != null && m.AwayTeam != null)
                .Select(m => m.ToMatch())
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "HTTP error fetching La Liga matches");
            throw new InvalidOperationException($"Failed to fetch La Liga matches: {ex.Message}", ex);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON parsing error for La Liga matches response");
            throw new InvalidOperationException($"Invalid response for La Liga matches: {ex.Message}", ex);
        }
    }

    /// <summary>
    /// Get details for a specific match
    /// </summary>
    public async Task<Match?> GetMatchDetailsAsync(string matchId)
    {
        try
        {
            var url = $"{BaseUrl}/matches/{matchId}";
            _logger.LogInformation("Fetching match details from Football-Data.org: {MatchId}", matchId);

            var response = await _httpClient.GetFromJsonAsync<FootballDataMatch>(
                url,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            return response?.ToMatch();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching match details from Football-Data.org");
            return null;
        }
    }
}

/// <summary>
/// Football-Data.org API Response models
/// </summary>
public class FootballDataMatchesResponse
{
    [JsonPropertyName("matches")]
    public List<FootballDataMatch>? Matches { get; set; } = new();

    [JsonPropertyName("competition")]
    public FootballDataCompetition? Competition { get; set; }
}

public class FootballDataCompetition
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("code")]
    public string? Code { get; set; }
}

public class FootballDataMatch
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }

    [JsonPropertyName("utcDate")]
    public DateTime? UtcDate { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; } // TIMED, LIVE, IN_PLAY, PAUSED, FINISHED, POSTPONED, CANCELLED, SUSPENDED

    [JsonPropertyName("stage")]
    public string? Stage { get; set; }

    [JsonPropertyName("homeTeam")]
    public FootballDataTeam? HomeTeam { get; set; }

    [JsonPropertyName("awayTeam")]
    public FootballDataTeam? AwayTeam { get; set; }

    [JsonPropertyName("score")]
    public FootballDataScore? Score { get; set; }

    [JsonPropertyName("competition")]
    public FootballDataCompetition? Competition { get; set; }
}

public class FootballDataTeam
{
    [JsonPropertyName("id")]
    public int? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("shortName")]
    public string? ShortName { get; set; }

    [JsonPropertyName("tla")]
    public string? Tla { get; set; }
}

public class FootballDataScore
{
    [JsonPropertyName("fullTime")]
    public FootballDataScoreDetails? FullTime { get; set; }

    [JsonPropertyName("halfTime")]
    public FootballDataScoreDetails? HalfTime { get; set; }
}

public class FootballDataScoreDetails
{
    [JsonPropertyName("home")]
    public int? Home { get; set; }

    [JsonPropertyName("away")]
    public int? Away { get; set; }
}

/// <summary>
/// Mapper from Football-Data.org to internal Match model
/// </summary>
public static class FootballDataMapper
{
    public static Match ToMatch(this FootballDataMatch match)
    {
        var status = NormalizeStatus(match.Status);

        return new Match
        {
            Id = match.Id?.ToString() ?? Guid.NewGuid().ToString(),
            ExternalId = match.Id,
            HomeTeam = match.HomeTeam?.Name ?? "Unknown",
            AwayTeam = match.AwayTeam?.Name ?? "Unknown",
            KickoffAtUtc = match.UtcDate ?? DateTime.UtcNow,
            Stage = match.Stage ?? "Grupos",
            Status = status,
            HomeScoreFinal = status == "FINISHED" ? match.Score?.FullTime?.Home : null,
            AwayScoreFinal = status == "FINISHED" ? match.Score?.FullTime?.Away : null
        };
    }

    private static string NormalizeStatus(string? status)
    {
        return status?.ToUpper() switch
        {
            "LIVE" or "IN_PLAY" => "LIVE",
            "FINISHED" => "FINISHED",
            "TIMED" or "SCHEDULED" => "SCHEDULED",
            "POSTPONED" or "CANCELLED" or "SUSPENDED" => "CANCELLED",
            _ => "SCHEDULED"
        };
    }
}
