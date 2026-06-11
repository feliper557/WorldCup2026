using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class ChampionPredictionRepository : IChampionPredictionRepository
{
    private readonly AppDbContext _db;

    public ChampionPredictionRepository(AppDbContext db) => _db = db;

    public async Task<ChampionPredictionEntity?> GetByUserIdAsync(string userId)
        => await _db.ChampionPredictions.FirstOrDefaultAsync(cp => cp.UserId == userId);

    public async Task<IEnumerable<ChampionPredictionEntity>> GetAllAsync()
        => await _db.ChampionPredictions.ToListAsync();

    public async Task<ChampionPredictionEntity> CreateAsync(ChampionPredictionEntity prediction)
    {
        await _db.ChampionPredictions.AddAsync(prediction);
        await _db.SaveChangesAsync();
        return prediction;
    }

    public async Task<ChampionPredictionEntity> UpdateAsync(ChampionPredictionEntity prediction)
    {
        prediction.UpdatedAt = DateTime.UtcNow;
        _db.ChampionPredictions.Update(prediction);
        await _db.SaveChangesAsync();
        return prediction;
    }

    public async Task DeleteByUserIdAsync(string userId)
    {
        var prediction = await GetByUserIdAsync(userId);
        if (prediction != null)
        {
            _db.ChampionPredictions.Remove(prediction);
            await _db.SaveChangesAsync();
        }
    }
}
