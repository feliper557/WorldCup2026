using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly AppDbContext _db;

    public PasswordResetTokenRepository(AppDbContext db) => _db = db;

    public async Task<PasswordResetTokenEntity> CreateAsync(PasswordResetTokenEntity token)
    {
        _db.PasswordResetTokens.Add(token);
        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<PasswordResetTokenEntity?> GetByTokenAsync(string token)
        => await _db.PasswordResetTokens.FirstOrDefaultAsync(t => t.Token == token);

    public async Task MarkUsedAsync(PasswordResetTokenEntity token)
    {
        token.IsUsed = true;
        token.UsedAt = DateTime.UtcNow;
        _db.PasswordResetTokens.Update(token);
        await _db.SaveChangesAsync();
    }

    public async Task InvalidatePreviousTokensAsync(string userId)
    {
        var previous = await _db.PasswordResetTokens
            .Where(t => t.UserId == userId && !t.IsUsed)
            .ToListAsync();

        foreach (var t in previous)
            t.IsUsed = true;

        await _db.SaveChangesAsync();
    }
}
