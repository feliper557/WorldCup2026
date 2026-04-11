using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class MatchRepository : IMatchRepository
{
    private readonly AppDbContext _db;

    public MatchRepository(AppDbContext db) => _db = db;

    public async Task<MatchEntity?> GetByIdAsync(string id)
        => await _db.Matches.FindAsync(id);

    public async Task<IEnumerable<MatchEntity>> GetAllAsync()
    {
        // Colombia time (UTC-5)
        var colombiaTime = DateTime.UtcNow.AddHours(-5);

        // Fetch ALL matches from database
        var allMatches = await _db.Matches
            .OrderBy(m => m.MatchDate)
            .ToListAsync();

        // Filter in memory (more reliable than SQL WHERE)
        var filtered = allMatches
            .Where(m =>
            {
                var status = m.Status?.ToUpper() ?? "";

                // Include SCHEDULED and LIVE always
                if (status == "SCHEDULED" || status == "LIVE")
                    return true;

                // Include all FINISHED (no date restriction)
                if (status == "FINISHED")
                    return true;

                return false;
            })
            .ToList();

        // Auto-update status based on Colombia time
        var hasChanges = false;
        foreach (var match in filtered)
        {
            var status = match.Status?.ToUpper() ?? "";
            var minutesSinceKickoff = (colombiaTime - match.MatchDate).TotalMinutes;

            if (status != "FINISHED" && minutesSinceKickoff >= 105)
            {
                // Más de 105 min desde inicio → FINISHED
                match.Status = "FINISHED";
                hasChanges = true;
            }
            else if (status == "SCHEDULED" && minutesSinceKickoff >= 0)
            {
                // Partido ya comenzó pero menos de 105 min → LIVE
                match.Status = "LIVE";
                hasChanges = true;
            }
        }

        if (hasChanges)
            await _db.SaveChangesAsync();

        return filtered;
    }

    public async Task<IEnumerable<MatchEntity>> GetUpcomingAsync()
    {
        // BD already stores times in Colombia time (UTC-5)
        // Compare directly with current Colombia time
        var now = DateTime.UtcNow.AddHours(-5);
        var allMatches = await _db.Matches.ToListAsync();
        return allMatches
            .Where(m => string.Equals(m.Status, "scheduled", StringComparison.OrdinalIgnoreCase) && m.MatchDate > now)
            .OrderBy(m => m.MatchDate)
            .ToList();
    }

    public async Task<IEnumerable<MatchEntity>> GetByStageAsync(string stage)
        => await _db.Matches
            .Where(m => m.Stage == stage)
            .OrderBy(m => m.MatchDate)
            .ToListAsync();

    public async Task<IEnumerable<MatchEntity>> GetByStatusAsync(string status)
    {
        var allMatches = await _db.Matches.ToListAsync();
        return allMatches
            .Where(m => string.Equals(m.Status, status, StringComparison.OrdinalIgnoreCase))
            .OrderBy(m => m.MatchDate)
            .ToList();
    }

    public async Task<MatchEntity> CreateAsync(MatchEntity match)
    {
        _db.Matches.Add(match);
        await _db.SaveChangesAsync();
        return match;
    }

    public async Task<MatchEntity> UpdateAsync(MatchEntity match)
    {
        _db.Matches.Update(match);
        await _db.SaveChangesAsync();
        return match;
    }

    public async Task<MatchEntity> UpsertAsync(MatchEntity match)
    {
        var existing = await GetByIdAsync(match.Id);
        if (existing != null)
        {
            return await UpdateAsync(match);
        }
        return await CreateAsync(match);
    }

    public async Task DeleteAsync(string id)
    {
        var match = await GetByIdAsync(id);
        if (match != null)
        {
            _db.Matches.Remove(match);
            await _db.SaveChangesAsync();
        }
    }
}
