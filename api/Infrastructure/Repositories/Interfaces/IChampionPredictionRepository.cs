using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IChampionPredictionRepository
{
    Task<ChampionPredictionEntity?> GetByUserIdAsync(string userId);
    Task<IEnumerable<ChampionPredictionEntity>> GetAllAsync();
    Task<ChampionPredictionEntity> CreateAsync(ChampionPredictionEntity prediction);
    Task<ChampionPredictionEntity> UpdateAsync(ChampionPredictionEntity prediction);
    Task DeleteByUserIdAsync(string userId);
}
