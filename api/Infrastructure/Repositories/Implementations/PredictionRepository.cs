using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class PredictionRepository : IPredictionRepository
{
    private readonly AppDbContext _db;

    public PredictionRepository(AppDbContext db) => _db = db;

    public async Task<PredictionEntity?> GetByIdAsync(string id)
        => await _db.Predictions.FindAsync(id);

    public async Task<PredictionEntity?> GetByUserAndMatchAsync(string userId, string matchId)
        => await _db.Predictions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.MatchId == matchId);

    public async Task<IEnumerable<PredictionEntity>> GetByUserIdAsync(string userId)
        => await _db.Predictions
            .Where(p => p.UserId == userId)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<PredictionEntity>> GetByMatchIdAsync(string matchId)
        => await _db.Predictions
            .Where(p => p.MatchId == matchId)
            .ToListAsync();

    public async Task<Dictionary<string, PredictionAggregate>> GetAggregatedByUserAsync()
    {
        // Single GROUP BY query — replaces N+1 loop in RankingFunction.
        // 3 pts = marcador exacto, 5 = exacto + bonus, 1 = solo ganador correcto.
        var rows = await _db.Predictions
            .GroupBy(p => p.UserId)
            .Select(g => new PredictionAggregate(
                g.Key,
                g.Sum(p => p.PointsEarned),
                g.Count(),
                g.Count(p => p.PointsEarned >= 3),
                g.Count(p => p.PointsEarned == 1)))
            .ToListAsync();

        return rows.ToDictionary(r => r.UserId);
    }

    public async Task<PredictionEntity> CreateAsync(PredictionEntity prediction)
    {
        _db.Predictions.Add(prediction);
        await _db.SaveChangesAsync();
        return prediction;
    }

    public async Task<PredictionEntity> UpdateAsync(PredictionEntity prediction)
    {
        var existing = await _db.Predictions.FindAsync(prediction.Id);
        if (existing != null)
        {
            existing.PredictedHomeScore = prediction.PredictedHomeScore;
            existing.PredictedAwayScore = prediction.PredictedAwayScore;
            existing.PredictedWinner = prediction.PredictedWinner;
            existing.PointsEarned = prediction.PointsEarned;
            existing.UpdatedAt = prediction.UpdatedAt ?? DateTime.UtcNow;
        }
        else
        {
            _db.Predictions.Update(prediction);
        }
        await _db.SaveChangesAsync();
        return existing ?? prediction;
    }

    public async Task<PredictionEntity> UpsertAsync(PredictionEntity prediction)
    {
        var existing = await GetByUserAndMatchAsync(prediction.UserId, prediction.MatchId);
        if (existing != null)
        {
            existing.PredictedHomeScore = prediction.PredictedHomeScore;
            existing.PredictedAwayScore = prediction.PredictedAwayScore;
            existing.PredictedWinner = prediction.PredictedWinner;
            existing.UpdatedAt = DateTime.UtcNow;
            return await UpdateAsync(existing);
        }

        return await CreateAsync(prediction);
    }

    public async Task DeleteAsync(string id)
    {
        var prediction = await GetByIdAsync(id);
        if (prediction != null)
        {
            _db.Predictions.Remove(prediction);
            await _db.SaveChangesAsync();
        }
    }
}
