using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class InvitationRepository : IInvitationRepository
{
    private readonly AppDbContext _db;

    public InvitationRepository(AppDbContext db) => _db = db;

    public async Task<InvitationEntity?> GetByTokenAsync(string encryptedToken)
        => await _db.Invitations.FirstOrDefaultAsync(i => i.Token == encryptedToken);

    public async Task<InvitationEntity?> GetByIdAsync(string id)
        => await _db.Invitations.FindAsync(id);

    public async Task<IEnumerable<InvitationEntity>> GetByEmailAsync(string email)
        => await _db.Invitations.Where(i => i.Email == email).ToListAsync();

    public async Task<InvitationEntity> CreateAsync(InvitationEntity invitation)
    {
        _db.Invitations.Add(invitation);
        await _db.SaveChangesAsync();
        return invitation;
    }

    public async Task<InvitationEntity> UpdateAsync(InvitationEntity invitation)
    {
        _db.Invitations.Update(invitation);
        await _db.SaveChangesAsync();
        return invitation;
    }

    public async Task<bool> MarkAsUsedAsync(string id, string userId)
    {
        var invitation = await GetByIdAsync(id);
        if (invitation == null)
            return false;

        invitation.Status = "used";
        invitation.UsedAt = DateTime.UtcNow;
        await UpdateAsync(invitation);
        return true;
    }

    public async Task<bool> RevokeAsync(string id)
    {
        var invitation = await GetByIdAsync(id);
        if (invitation == null)
            return false;

        invitation.Status = "expired";
        await UpdateAsync(invitation);
        return true;
    }

    public async Task<IEnumerable<InvitationEntity>> GetPendingByAdminAsync(string adminId)
        => await _db.Invitations
            .Where(i => i.Status == "pending")
            .OrderByDescending(i => i.CreatedAtUtc)
            .ToListAsync();

    public async Task DeleteAsync(string id)
    {
        var invitation = await GetByIdAsync(id);
        if (invitation != null)
        {
            _db.Invitations.Remove(invitation);
            await _db.SaveChangesAsync();
        }
    }
}
