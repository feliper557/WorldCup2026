using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

/// <summary>
/// Repository interface for managing users
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// Create a new user
    /// </summary>
    Task<UserEntity> CreateAsync(UserEntity user);

    /// <summary>
    /// Get user by ID
    /// </summary>
    Task<UserEntity?> GetByIdAsync(string id);

    /// <summary>
    /// Get user by email
    /// </summary>
    Task<UserEntity?> GetByEmailAsync(string email);

    /// <summary>
    /// Check if email already exists
    /// </summary>
    Task<bool> EmailExistsAsync(string email);

    /// <summary>
    /// Update user profile
    /// </summary>
    Task<UserEntity> UpdateAsync(UserEntity user);

    /// <summary>
    /// Get all users ordered by total points (leaderboard)
    /// </summary>
    Task<IEnumerable<UserEntity>> GetLeaderboardAsync(int limit = 100);

    /// <summary>
    /// Get user rank in leaderboard
    /// </summary>
    Task<int?> GetUserRankAsync(string userId);

    /// <summary>
    /// Update user points and predictions
    /// </summary>
    Task UpdateScoreAsync(string userId, int points, bool correct);

    /// <summary>
    /// Delete user
    /// </summary>
    Task DeleteAsync(string id);

    /// <summary>
    /// Get all users
    /// </summary>
    Task<IEnumerable<UserEntity>> GetAllAsync();
}
