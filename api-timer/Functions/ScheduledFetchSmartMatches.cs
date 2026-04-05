using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Extensions;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Services;

namespace ApiTimer.Functions;

/// <summary>
/// UNIFIED SMART Function - Auto-switches La Liga ↔ World Cup
/// Intelligent date-based fetching to minimize API calls
/// Runs daily at 3 AM UTC
/// </summary>
public class ScheduledFetchSmartMatches
{
    private readonly IFootballDataService _footballDataService;
    private readonly IMatchRepository _matchRepository;
    private readonly ILogger<ScheduledFetchSmartMatches> _logger;

    // World Cup 2026 dates
    private static readonly DateTime WC_FULL_LOAD_START = new DateTime(2026, 6, 1);
    private static readonly DateTime WC_FULL_LOAD_END = new DateTime(2026, 6, 2, 23, 59, 59);
    private static readonly DateTime WC_MATCHES_START = new DateTime(2026, 6, 11);
    private static readonly DateTime WC_MATCHES_END = new DateTime(2026, 6, 27);
    private static readonly DateTime WC_LIVE_START = new DateTime(2026, 6, 10);
    private static readonly DateTime WC_FINALS_START = new DateTime(2026, 6, 25);

    public ScheduledFetchSmartMatches(
        IFootballDataService footballDataService,
        IMatchRepository matchRepository,
        ILogger<ScheduledFetchSmartMatches> logger)
    {
        _footballDataService = footballDataService;
        _matchRepository = matchRepository;
        _logger = logger;
    }

    [Function("ScheduledFetchSmartMatches")]
    public async Task Run(
        [TimerTrigger("0 3 * * *")] TimerInfo timer)
    {
        var now = DateTime.UtcNow;
        _logger.LogInformation("🔄 === SMART FETCH triggered at {time} UTC ===", now);

        try
        {
            // Check if database is empty - if so, do initial load regardless of time
            var allMatches = await _matchRepository.GetAllAsync();
            bool isDbEmpty = allMatches.Count() == 0;

            if (isDbEmpty)
            {
                _logger.LogInformation("📊 Database is empty - performing initial load");
                await FetchLaLigaMatches(now);
                return;
            }

            if (now < WC_FULL_LOAD_START)
            {
                _logger.LogInformation("📊 PHASE 1: Fetching LA LIGA (before World Cup)");
                await FetchLaLigaMatches(now);
            }
            else if (now >= WC_FULL_LOAD_START && now <= WC_FULL_LOAD_END)
            {
                _logger.LogInformation("🌍 PHASE 2: FULL LOAD World Cup (June 11-27)");
                await FetchWorldCupFullLoad();
            }
            else if (now >= WC_LIVE_START)
            {
                if (now < WC_FINALS_START)
                {
                    _logger.LogInformation("🌍 PHASE 3A: Smart fetch (hoy + mañana para validar cambios)");
                    await FetchWorldCupSmartToday(now);
                }
                else
                {
                    _logger.LogInformation("🌍 PHASE 3B: Finals - SOLO equipos confirmados");
                    await FetchWorldCupConfirmedTeamsOnly(now);
                }
            }

            _logger.LogInformation("✅ ScheduledFetchSmartMatches completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error in ScheduledFetchSmartMatches: {Message}", ex.Message);
            throw;
        }

        if (timer.IsPastDue)
        {
            _logger.LogWarning("⚠️ Function is running late!");
        }
    }

    private async Task FetchLaLigaMatches(DateTime now)
    {
        try
        {
            var laLigaMatches = await _footballDataService.GetSpanishLaLigaMatches();

            if (laLigaMatches.Count() == 0)
            {
                _logger.LogWarning("No La Liga matches retrieved");
                return;
            }

            var upcomingMatches = laLigaMatches
                .Where(m => m.KickoffAtUtc >= now && m.KickoffAtUtc <= now.AddDays(7))
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "📊 La Liga: {Total} total → {Upcoming} upcoming (next 7 days)",
                laLigaMatches.Count(),
                upcomingMatches.Count());

            foreach (var match in upcomingMatches)
            {
                await _matchRepository.UpsertAsync(match.ToEntity());
            }

            _logger.LogInformation("✅ La Liga: Stored {Count} matches", upcomingMatches.Count());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching La Liga: {Message}", ex.Message);
            throw;
        }
    }

    private async Task FetchWorldCupFullLoad()
    {
        try
        {
            var wcMatches = await _footballDataService.GetWorldCupMatches();

            if (wcMatches.Count() == 0)
            {
                _logger.LogWarning("No World Cup matches retrieved");
                return;
            }

            var allMatches = wcMatches
                .Where(m => m.KickoffAtUtc >= WC_MATCHES_START && m.KickoffAtUtc <= WC_MATCHES_END)
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "🌍 FULL LOAD: {Total} total → {AllMatches} from Jun 11-27",
                wcMatches.Count(),
                allMatches.Count());

            foreach (var match in allMatches)
            {
                await _matchRepository.UpsertAsync(match.ToEntity());
            }

            _logger.LogInformation("✅ FULL LOAD: Stored {Count} World Cup matches", allMatches.Count());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in FULL LOAD: {Message}", ex.Message);
            throw;
        }
    }

    private async Task FetchWorldCupSmartToday(DateTime now)
    {
        try
        {
            var wcMatches = await _footballDataService.GetWorldCupMatches();

            if (wcMatches.Count() == 0)
            {
                _logger.LogWarning("No World Cup matches retrieved");
                return;
            }

            var todayStart = now.Date;
            var tomorrowEnd = now.Date.AddDays(2).AddTicks(-1);

            var todayAndTomorrow = wcMatches
                .Where(m => m.KickoffAtUtc >= todayStart && m.KickoffAtUtc <= tomorrowEnd)
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "🌍 Smart fetch: {Total} total → {TodayTomorrow} today + tomorrow",
                wcMatches.Count(),
                todayAndTomorrow.Count());

            int updated = 0;
            int inserted = 0;

            foreach (var match in todayAndTomorrow)
            {
                var existing = await _matchRepository.GetByIdAsync(match.Id);
                if (existing != null)
                {
                    if (existing.MatchDate != match.KickoffAtUtc)
                    {
                        _logger.LogWarning(
                            "⚠️ TIME CHANGE: {HomeTeam} vs {AwayTeam} - Old: {OldTime} → New: {NewTime}",
                            match.HomeTeam,
                            match.AwayTeam,
                            existing.MatchDate.ToString("HH:mm"),
                            match.KickoffAtUtc.ToString("HH:mm"));
                        updated++;
                    }
                }
                else
                {
                    inserted++;
                }

                await _matchRepository.UpsertAsync(match.ToEntity());
            }

            _logger.LogInformation(
                "✅ Smart fetch: {Inserted} new, {Updated} time changes",
                inserted,
                updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in smart fetch: {Message}", ex.Message);
            throw;
        }
    }

    private async Task FetchWorldCupConfirmedTeamsOnly(DateTime now)
    {
        try
        {
            var wcMatches = await _footballDataService.GetWorldCupMatches();

            if (wcMatches.Count() == 0)
            {
                _logger.LogWarning("No World Cup matches retrieved");
                return;
            }

            var confirmedMatches = wcMatches
                .Where(m => m.KickoffAtUtc >= WC_FINALS_START
                    && !string.IsNullOrEmpty(m.HomeTeam)
                    && !string.IsNullOrEmpty(m.AwayTeam)
                    && !m.HomeTeam.Contains("TBD", StringComparison.OrdinalIgnoreCase)
                    && !m.AwayTeam.Contains("TBD", StringComparison.OrdinalIgnoreCase)
                    && !m.HomeTeam.Contains("TBA", StringComparison.OrdinalIgnoreCase)
                    && !m.AwayTeam.Contains("TBA", StringComparison.OrdinalIgnoreCase))
                .OrderBy(m => m.KickoffAtUtc)
                .ToList();

            _logger.LogInformation(
                "🌍 Finals (confirmed only): {Total} total → {Confirmed} with confirmed teams",
                wcMatches.Count(),
                confirmedMatches.Count());

            foreach (var match in confirmedMatches)
            {
                await _matchRepository.UpsertAsync(match.ToEntity());
            }

            _logger.LogInformation("✅ Finals: Stored {Count} confirmed matches", confirmedMatches.Count());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching finals: {Message}", ex.Message);
            throw;
        }
    }
}
