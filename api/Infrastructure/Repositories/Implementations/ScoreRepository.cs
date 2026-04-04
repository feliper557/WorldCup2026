using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class ScoreRepository : IScoreRepository
{
    private readonly AppDbContext _db;

    public ScoreRepository(AppDbContext db) => _db = db;

    public async Task<ScoreEntity?> GetByUserIdAsync(string userId)
        => await _db.Scores.FirstOrDefaultAsync(s => s.UserId == userId);

    public async Task<IEnumerable<ScoreEntity>> GetTopScoresAsync(int count = 100)
        => await _db.Scores
            .OrderByDescending(s => s.TotalPoints)
            .Take(count)
            .ToListAsync();

    public async Task<ScoreEntity> UpsertAsync(ScoreEntity score)
    {
        var existing = await GetByUserIdAsync(score.UserId);
        if (existing != null)
        {
            existing.TotalPoints = score.TotalPoints;
            existing.TotalPredictions = score.TotalPredictions;
            existing.CorrectPredictions = score.CorrectPredictions;
            existing.UpdatedAt = DateTime.UtcNow;
            _db.Scores.Update(existing);
        }
        else
        {
            _db.Scores.Add(score);
        }

        await _db.SaveChangesAsync();
        return existing ?? score;
    }

    public async Task DeleteAsync(string userId)
    {
        var score = await GetByUserIdAsync(userId);
        if (score != null)
        {
            _db.Scores.Remove(score);
            await _db.SaveChangesAsync();
        }
    }
}
