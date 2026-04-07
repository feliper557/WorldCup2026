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
        var matches = await _db.Matches.OrderBy(m => m.MatchDate).ToListAsync();
        // Auto-update status based on time (Colombia time UTC-5)
        var colombiaTime = DateTime.UtcNow.AddHours(-5);
        const int minutesUntilFinished = 105; // Match considered finished after 105 minutes

        foreach (var match in matches)
        {
            // If SCHEDULED and kickoff has passed → mark as LIVE
            if (match.Status?.Equals("SCHEDULED", StringComparison.OrdinalIgnoreCase) == true
                && match.MatchDate <= colombiaTime)
            {
                match.Status = "LIVE";
            }

            // If SCHEDULED or LIVE and 105+ minutes have passed → mark as FINISHED
            if ((match.Status?.Equals("SCHEDULED", StringComparison.OrdinalIgnoreCase) == true ||
                 match.Status?.Equals("LIVE", StringComparison.OrdinalIgnoreCase) == true)
                && match.MatchDate.AddMinutes(minutesUntilFinished) <= colombiaTime)
            {
                match.Status = "FINISHED";
            }
        }
        return matches;
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
