using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IEventRepository
{
    Task<EventEntity?> GetByIdAsync(string id);
    Task<List<EventEntity>> GetAllAsync();
    Task<EventEntity> CreateAsync(EventEntity ev);
    Task<EventEntity> UpdateAsync(EventEntity ev);
    Task CancelAsync(string id);
}
