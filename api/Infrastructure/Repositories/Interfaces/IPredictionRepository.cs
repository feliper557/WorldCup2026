using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public record PredictionAggregate(
    string UserId,
    int TotalPoints,
    int TotalPredictions,
    int ExactScores,
    int CorrectWinners);

public interface IPredictionRepository
{
    Task<PredictionEntity?> GetByIdAsync(string id);
    Task<PredictionEntity?> GetByUserAndMatchAsync(string userId, string matchId);
    Task<IEnumerable<PredictionEntity>> GetByUserIdAsync(string userId);
    Task<IEnumerable<PredictionEntity>> GetByMatchIdAsync(string matchId);
    Task<Dictionary<string, PredictionAggregate>> GetAggregatedByUserAsync();
    Task<PredictionEntity> CreateAsync(PredictionEntity prediction);
    Task<PredictionEntity> UpdateAsync(PredictionEntity prediction);
    Task<PredictionEntity> UpsertAsync(PredictionEntity prediction);
    Task DeleteAsync(string id);
}
