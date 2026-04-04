using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class EventRepository : IEventRepository
{
    private readonly AppDbContext _db;

    public EventRepository(AppDbContext db) => _db = db;

    public async Task<EventEntity?> GetByIdAsync(string id)
        => await _db.Events.FindAsync(id);

    public async Task<List<EventEntity>> GetAllAsync()
        => await _db.Events
            .OrderBy(e => e.Date)
            .ToListAsync();

    public async Task<EventEntity> CreateAsync(EventEntity ev)
    {
        _db.Events.Add(ev);
        await _db.SaveChangesAsync();
        return ev;
    }

    public async Task<EventEntity> UpdateAsync(EventEntity ev)
    {
        _db.Events.Update(ev);
        await _db.SaveChangesAsync();
        return ev;
    }

    public async Task CancelAsync(string id)
    {
        var ev = await GetByIdAsync(id);
        if (ev != null)
        {
            ev.Status = "cancelled";
            await UpdateAsync(ev);
        }
    }
}
