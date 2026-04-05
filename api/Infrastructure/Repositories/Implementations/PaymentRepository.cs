using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;

namespace WorldCup.Api.Infrastructure.Repositories.Implementations;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _db;

    public PaymentRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PaymentEntity?> GetByIdAsync(string id) =>
        await _db.Payments.FindAsync(id);

    public async Task<PaymentEntity?> GetByWompiTransactionIdAsync(string transactionId) =>
        await _db.Payments
            .FirstOrDefaultAsync(p => p.WompiTransactionId == transactionId);

    public async Task<PaymentEntity?> GetByWompiReferenceAsync(string reference) =>
        await _db.Payments
            .FirstOrDefaultAsync(p => p.WompiReference == reference);

    public async Task<List<PaymentEntity>> GetByUserIdAsync(string userId) =>
        await _db.Payments
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

    public async Task<PaymentEntity> CreateAsync(PaymentEntity payment)
    {
        _db.Payments.Add(payment);
        await _db.SaveChangesAsync();
        return payment;
    }

    public async Task<PaymentEntity> UpdateAsync(PaymentEntity payment)
    {
        _db.Payments.Update(payment);
        await _db.SaveChangesAsync();
        return payment;
    }

    public async Task<bool> ExistsByWompiTransactionIdAsync(string transactionId) =>
        await _db.Payments
            .AnyAsync(p => p.WompiTransactionId == transactionId);

    public async Task<List<PaymentEntity>> GetAllAsync() =>
        await _db.Payments
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

    public async Task<List<PaymentEntity>> GetApprovedPaymentsByDateRangeAsync(DateTime from, DateTime to) =>
        await _db.Payments
            .Where(p => p.Status == "APPROVED"
                    && p.CreatedAtUtc >= from
                    && p.CreatedAtUtc <= to)
            .OrderByDescending(p => p.CreatedAtUtc)
            .ToListAsync();

    public async Task<decimal> GetTotalRevenueAsync(DateTime from, DateTime to) =>
        await _db.Payments
            .Where(p => p.Status == "APPROVED"
                    && p.CreatedAtUtc >= from
                    && p.CreatedAtUtc <= to)
            .SumAsync(p => p.AmountCOP);
}
