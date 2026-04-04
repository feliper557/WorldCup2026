using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class RaffleRepository : IRaffleRepository
{
    private readonly AppDbContext _db;

    public RaffleRepository(AppDbContext db) => _db = db;

    public async Task<RaffleEntity?> GetByIdAsync(string id)
        => await _db.Raffles
            .Include(r => r.Participants)
            .Include(r => r.Winners)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<List<RaffleEntity>> GetAllAsync()
        => await _db.Raffles
            .Include(r => r.Participants)
            .Include(r => r.Winners)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

    public async Task<RaffleEntity> CreateAsync(RaffleEntity raffle)
    {
        _db.Raffles.Add(raffle);
        await _db.SaveChangesAsync();
        return raffle;
    }

    public async Task<RaffleEntity> UpdateAsync(RaffleEntity raffle)
    {
        _db.Raffles.Update(raffle);
        await _db.SaveChangesAsync();
        return raffle;
    }

    public async Task AddParticipantAsync(string raffleId, string userId)
    {
        var participant = new RaffleParticipantEntity { RaffleId = raffleId, UserId = userId };
        _db.RaffleParticipants.Add(participant);
        await _db.SaveChangesAsync();
    }

    public async Task RemoveParticipantAsync(string raffleId, string userId)
    {
        var participant = await _db.RaffleParticipants
            .FirstOrDefaultAsync(rp => rp.RaffleId == raffleId && rp.UserId == userId);
        if (participant != null)
        {
            _db.RaffleParticipants.Remove(participant);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<UserEntity>> GetParticipantsAsync(string raffleId)
        => await _db.RaffleParticipants
            .Where(rp => rp.RaffleId == raffleId)
            .Select(rp => rp.User)
            .ToListAsync();

    public async Task SetWinnersAsync(string raffleId, List<string> winnerIds)
    {
        // Remove existing winners
        var existingWinners = await _db.RaffleWinners
            .Where(rw => rw.RaffleId == raffleId)
            .ToListAsync();
        _db.RaffleWinners.RemoveRange(existingWinners);

        // Add new winners
        foreach (var winnerId in winnerIds)
        {
            var winner = new RaffleWinnerEntity { RaffleId = raffleId, UserId = winnerId };
            _db.RaffleWinners.Add(winner);
        }

        await _db.SaveChangesAsync();
    }
}
