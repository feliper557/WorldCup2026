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
        => await _db.Matches.OrderBy(m => m.MatchDate).ToListAsync();

    public async Task<IEnumerable<MatchEntity>> GetUpcomingAsync()
        => await _db.Matches
            .Where(m => m.Status == "scheduled" && m.MatchDate > DateTime.UtcNow)
            .OrderBy(m => m.MatchDate)
            .ToListAsync();

    public async Task<IEnumerable<MatchEntity>> GetByStageAsync(string stage)
        => await _db.Matches
            .Where(m => m.Stage == stage)
            .OrderBy(m => m.MatchDate)
            .ToListAsync();

    public async Task<IEnumerable<MatchEntity>> GetByStatusAsync(string status)
        => await _db.Matches
            .Where(m => m.Status == status)
            .OrderBy(m => m.MatchDate)
            .ToListAsync();

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
