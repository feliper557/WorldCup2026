using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IPredictionRepository
{
    Task<PredictionEntity?> GetByIdAsync(string id);
    Task<PredictionEntity?> GetByUserAndMatchAsync(string userId, string matchId);
    Task<IEnumerable<PredictionEntity>> GetByUserIdAsync(string userId);
    Task<IEnumerable<PredictionEntity>> GetByMatchIdAsync(string matchId);
    Task<PredictionEntity> CreateAsync(PredictionEntity prediction);
    Task<PredictionEntity> UpdateAsync(PredictionEntity prediction);
    Task<PredictionEntity> UpsertAsync(PredictionEntity prediction);
    Task DeleteAsync(string id);
}
