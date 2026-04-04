using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public async Task<UserEntity?> GetByIdAsync(string id)
        => await _db.Users.FindAsync(id);

    public async Task<UserEntity?> GetByEmailAsync(string email)
        => await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<bool> EmailExistsAsync(string email)
        => await _db.Users.AnyAsync(u => u.Email == email);

    public async Task<UserEntity> CreateAsync(UserEntity user)
    {
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<UserEntity> UpdateAsync(UserEntity user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
        return user;
    }

    public async Task<IEnumerable<UserEntity>> GetLeaderboardAsync(int limit = 100)
        => await _db.Users
            .Where(u => u.Status == "active")
            .OrderByDescending(u => u.TotalPoints)
            .Take(limit)
            .ToListAsync();

    public async Task<int?> GetUserRankAsync(string userId)
    {
        var user = await GetByIdAsync(userId);
        if (user == null)
            return null;

        var rank = await _db.Users
            .Where(u => u.Status == "active" && u.TotalPoints > user.TotalPoints)
            .CountAsync();

        return rank + 1;
    }

    public async Task UpdateScoreAsync(string userId, int points, bool correct)
    {
        var user = await GetByIdAsync(userId);
        if (user == null)
            return;

        user.TotalPoints += points;
        user.TotalPredictions++;
        if (correct)
            user.CorrectPredictions++;

        if (user.TotalPredictions > 0)
            user.AccuracyPercentage = (double)user.CorrectPredictions / user.TotalPredictions * 100;

        await UpdateAsync(user);
    }

    public async Task DeleteAsync(string id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<UserEntity>> GetAllAsync()
        => await _db.Users.OrderBy(u => u.CreatedAt).ToListAsync();
}
