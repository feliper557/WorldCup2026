using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IScoreRepository
{
    Task<ScoreEntity?> GetByUserIdAsync(string userId);
    Task<IEnumerable<ScoreEntity>> GetTopScoresAsync(int count = 100);
    Task<ScoreEntity> UpsertAsync(ScoreEntity score);
    Task DeleteAsync(string userId);
}
