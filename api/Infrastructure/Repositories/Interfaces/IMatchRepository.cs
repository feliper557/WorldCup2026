using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IMatchRepository
{
    Task<MatchEntity?> GetByIdAsync(string id);
    Task<IEnumerable<MatchEntity>> GetAllAsync();
    Task<IEnumerable<MatchEntity>> GetAllWithStatusAsync();
    Task<IEnumerable<MatchEntity>> GetUpcomingAsync();
    Task<IEnumerable<MatchEntity>> GetByStageAsync(string stage);
    Task<IEnumerable<MatchEntity>> GetByStatusAsync(string status);
    Task<MatchEntity> CreateAsync(MatchEntity match);
    Task<MatchEntity> UpdateAsync(MatchEntity match);
    Task<MatchEntity> UpsertAsync(MatchEntity match);
    Task DeleteAsync(string id);
}
