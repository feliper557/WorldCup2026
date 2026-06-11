using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IPasswordResetTokenRepository
{
    Task<PasswordResetTokenEntity> CreateAsync(PasswordResetTokenEntity token);
    Task<PasswordResetTokenEntity?> GetByTokenAsync(string token);
    Task MarkUsedAsync(PasswordResetTokenEntity token);
    Task InvalidatePreviousTokensAsync(string userId);
}
