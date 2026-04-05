using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure.Repositories.Interfaces;

public interface IPaymentRepository
{
    /// <summary>Obtener pago por ID</summary>
    Task<PaymentEntity?> GetByIdAsync(string id);

    /// <summary>Obtener pago por ID de transacción Wompi</summary>
    Task<PaymentEntity?> GetByWompiTransactionIdAsync(string transactionId);

    /// <summary>Obtener pago por referencia Wompi</summary>
    Task<PaymentEntity?> GetByWompiReferenceAsync(string reference);

    /// <summary>Obtener pagos de un usuario</summary>
    Task<List<PaymentEntity>> GetByUserIdAsync(string userId);

    /// <summary>Crear nuevo pago</summary>
    Task<PaymentEntity> CreateAsync(PaymentEntity payment);

    /// <summary>Actualizar pago existente</summary>
    Task<PaymentEntity> UpdateAsync(PaymentEntity payment);

    /// <summary>Verificar si un pago ya existe por ID de transacción</summary>
    Task<bool> ExistsByWompiTransactionIdAsync(string transactionId);

    /// <summary>Obtener todos los pagos (para reportes)</summary>
    Task<List<PaymentEntity>> GetAllAsync();

    /// <summary>Obtener pagos aprobados en un rango de fechas</summary>
    Task<List<PaymentEntity>> GetApprovedPaymentsByDateRangeAsync(DateTime from, DateTime to);

    /// <summary>Obtener total de ingresos en un período</summary>
    Task<decimal> GetTotalRevenueAsync(DateTime from, DateTime to);
}
