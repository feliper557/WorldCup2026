using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

using WorldCup.Api.Extensions;
namespace WorldCup.Api.Functions;

/// <summary>
/// Unified scheduled function for fetching matches
/// Automatically switches between La Liga and World Cup based on date
///
/// Estrategia:
/// - Antes 1 de junio: Consulta La Liga
/// - 1-2 junio: Carga TODOS los partidos del Mundial 11-25 junio
/// - 3-10 junio: Consulta La Liga (sin partidos Mundial)
/// - 11+ junio: Solo partidos confirmados desde 22 junio
/// </summary>
public class ScheduledFetchCompetitionMatchesFunction
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<ScheduledFetchCompetitionMatchesFunction> _logger;

    // World Cup 2026 dates
    private static readonly DateTime WORLD_CUP_START = new DateTime(2026, 6, 11);
    private static readonly DateTime WORLD_CUP_END = new DateTime(2026, 6, 25);
    private static readonly DateTime WORLD_CUP_FULL_LOAD = new DateTime(2026, 6, 1);
    private static readonly DateTime WORLD_CUP_LIVE = new DateTime(2026, 6, 11);
    private static readonly DateTime WORLD_CUP_FILTERED_START = new DateTime(2026, 6, 22);

    public ScheduledFetchCompetitionMatchesFunction(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        ILogger<ScheduledFetchCompetitionMatchesFunction> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("ScheduledFetchCompetitionMatches")]
    public async Task Run(
        [TimerTrigger("0 3 * * *")] TimerInfo timer) // Daily at 3 AM UTC
    {
        var now = DateTime.UtcNow;
        _logger.LogInformation(
            "=== ScheduledFetchCompetitionMatches triggered at {time} UTC",
            now);

        try
        {
            // Determine which competition to fetch based on date
            if (now < WORLD_CUP_FULL_LOAD)
            {
                // Before June 1: Fetch La Liga
                await FetchLaLigaMatches(now);
            }
            else if (now >= WORLD_CUP_FULL_LOAD && now <= new DateTime(2026, 6, 2, 23, 59, 59))
            {
                // June 1-2: FULL LOAD - Get ALL World Cup matches for June 11-25
                await FetchWorldCupFullLoad(now);
            }
            else if (now >= new DateTime(2026, 6, 3) && now < WORLD_CUP_LIVE)
            {
                // June 3-10: Back to La Liga (no World Cup matches yet)
                await FetchLaLigaMatches(now);
            }
            else if (now >= WORLD_CUP_LIVE)
            {
                // June 11+: FILTERED - Only confirmed matches from June 22 onwards
                await FetchWorldCupFiltered(now);
            }

            _logger.LogInformation("ScheduledFetchCompetitionMatches completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ScheduledFetchCompetitionMatches: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("ScheduledFetchCompetitionMatches function is running late!");
        }
    }

    /// <summary>
    /// Fetch La Liga matches for upcoming 7 days
    /// Used: Before June 1 and June 3-10
    /// </summary>
    private async Task FetchLaLigaMatches(DateTime now)
    {
        _logger.LogInformation("📊 Fetching LA LIGA matches...");

        try
        {
            var laLigaMatches = await _footballDataService.GetSpanishLaLigaMatches();

            if (laLigaMatches.Count() == 0)
            {
                _logger.LogWarning("No La Liga matches retrieved");
                return;
            }

            // Filter for upcoming matches (next 7 days)
            var upcomingMatches = laLigaMatches
                .Where(m => m.KickoffAtUtc >= now && m.KickoffAtUtc <= now.AddDays(7))
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "La Liga: Found {Total} total, {Upcoming} upcoming in next 7 days",
                laLigaMatches.Count,
                upcomingMatches.Count);

            // Store matches
            foreach (var match in upcomingMatches)
            {
                await _matchRepository.UpsertAsync(match.ToEntity());
                _logger.LogInformation(
                    "La Liga: {HomeTeam} vs {AwayTeam} - {KickoffTime}",
                    match.HomeTeam,
                    match.AwayTeam,
                    match.KickoffAtUtc.ToString("yyyy-MM-dd HH:mm"));
            }

            _logger.LogInformation("✅ La Liga: Stored {Count} matches", upcomingMatches.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching La Liga matches: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// FULL LOAD: Fetch ALL World Cup matches from June 11-25
    /// Used: June 1-2 (preparation phase)
    /// Purpose: Load all matches to lock predictions before they start
    /// </summary>
    private async Task FetchWorldCupFullLoad(DateTime now)
    {
        _logger.LogInformation("🌍 WORLD CUP FULL LOAD - Fetching ALL matches from {Start} to {End}",
            WORLD_CUP_START.ToString("yyyy-MM-dd"),
            WORLD_CUP_END.ToString("yyyy-MM-dd"));

        try
        {
            var worldCupMatches = await _footballDataService.GetWorldCupMatches();

            if (worldCupMatches.Count() == 0)
            {
                _logger.LogWarning("No World Cup matches retrieved");
                return;
            }

            // Get ALL matches from June 11-25 (entire tournament)
            var allMatches = worldCupMatches
                .Where(m => m.KickoffAtUtc >= WORLD_CUP_START && m.KickoffAtUtc <= WORLD_CUP_END)
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "🌍 World Cup FULL LOAD: Found {Total} total, {Period} from Jun 11-25",
                worldCupMatches.Count,
                allMatches.Count);

            if (allMatches.Count > 0)
            {
                // Store ALL matches for the tournament period
                foreach (var match in allMatches)
                {
                    await _matchRepository.UpsertAsync(match.ToEntity());
                    _logger.LogInformation(
                        "🌍 World Cup: {HomeTeam} vs {AwayTeam} - {KickoffTime} ({Stage})",
                        match.HomeTeam,
                        match.AwayTeam,
                        match.KickoffAtUtc.ToString("yyyy-MM-dd HH:mm"),
                        match.Stage ?? "UNKNOWN");
                }

                _logger.LogInformation("✅ World Cup FULL LOAD: Stored {Count} matches for tournament", allMatches.Count);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in World Cup FULL LOAD: {Message}", ex.Message);
            throw;
        }
    }

    /// <summary>
    /// FILTERED: Fetch only confirmed World Cup matches from June 22 onwards
    /// Used: June 11+ (during tournament, save API calls)
    /// Purpose: Get live/upcoming matches only, avoid unnecessary calls
    /// </summary>
    private async Task FetchWorldCupFiltered(DateTime now)
    {
        _logger.LogInformation("🌍 WORLD CUP FILTERED - Fetching confirmed matches from {Start} onwards",
            WORLD_CUP_FILTERED_START.ToString("yyyy-MM-dd"));

        try
        {
            var worldCupMatches = await _footballDataService.GetWorldCupMatches();

            if (worldCupMatches.Count() == 0)
            {
                _logger.LogWarning("No World Cup matches retrieved");
                return;
            }

            // Get only matches from June 22 onwards (knockout stages + final)
            var confirmedMatches = worldCupMatches
                .Where(m => m.KickoffAtUtc >= WORLD_CUP_FILTERED_START && m.KickoffAtUtc <= WORLD_CUP_END)
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "🌍 World Cup FILTERED: Found {Total} total, {Confirmed} confirmed from Jun 22+",
                worldCupMatches.Count,
                confirmedMatches.Count);

            // Store matches
            foreach (var match in confirmedMatches)
            {
                await _matchRepository.UpsertAsync(match.ToEntity());
                _logger.LogInformation(
                    "🌍 World Cup: {HomeTeam} vs {AwayTeam} - {KickoffTime} ({Stage})",
                    match.HomeTeam,
                    match.AwayTeam,
                    match.KickoffAtUtc.ToString("yyyy-MM-dd HH:mm"),
                    match.Stage ?? "UNKNOWN");
            }

            _logger.LogInformation("✅ World Cup FILTERED: Stored {Count} confirmed matches", confirmedMatches.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in World Cup FILTERED: {Message}", ex.Message);
            throw;
        }
    }
}
