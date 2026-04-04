using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IRaffleRepository
{
    Task<RaffleEntity?> GetByIdAsync(string id);
    Task<List<RaffleEntity>> GetAllAsync();
    Task<RaffleEntity> CreateAsync(RaffleEntity raffle);
    Task<RaffleEntity> UpdateAsync(RaffleEntity raffle);
    Task AddParticipantAsync(string raffleId, string userId);
    Task RemoveParticipantAsync(string raffleId, string userId);
    Task<List<UserEntity>> GetParticipantsAsync(string raffleId);
    Task SetWinnersAsync(string raffleId, List<string> winnerIds);
}
