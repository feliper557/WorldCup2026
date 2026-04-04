using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

/// <summary>
/// Repository interface for managing invitations
/// </summary>
public interface IInvitationRepository
{
    /// <summary>
    /// Create a new invitation
    /// </summary>
    Task<InvitationEntity> CreateAsync(InvitationEntity invitation);

    /// <summary>
    /// Get invitation by encrypted token
    /// </summary>
    Task<InvitationEntity?> GetByTokenAsync(string encryptedToken);

    /// <summary>
    /// Get invitation by ID
    /// </summary>
    Task<InvitationEntity?> GetByIdAsync(string id);

    /// <summary>
    /// Get invitation by email
    /// </summary>
    Task<IEnumerable<InvitationEntity>> GetByEmailAsync(string email);

    /// <summary>
    /// Update invitation (mark as used, expired, etc)
    /// </summary>
    Task<InvitationEntity> UpdateAsync(InvitationEntity invitation);

    /// <summary>
    /// Mark invitation as used
    /// </summary>
    Task<bool> MarkAsUsedAsync(string id, string userId);

    /// <summary>
    /// Mark invitation as revoked
    /// </summary>
    Task<bool> RevokeAsync(string id);

    /// <summary>
    /// Get all pending invitations for an admin
    /// </summary>
    Task<IEnumerable<InvitationEntity>> GetPendingByAdminAsync(string adminId);

    /// <summary>
    /// Delete invitation
    /// </summary>
    Task DeleteAsync(string id);
}
