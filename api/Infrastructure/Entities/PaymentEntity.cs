namespace WorldCup.Api.Infrastructure.Entities;

/// <summary>
/// Registra cada pago recibido a través del flujo de auto-registro con Wompi
/// Permite auditar, generar reportes de ingresos, y procesar reembolsos
/// </summary>
public class PaymentEntity
{
    /// <summary>ID único del pago (generado por el sistema)</summary>
    public string Id { get; set; } = Guid.NewGuid().ToString();

    /// <summary>FK a UserEntity - el usuario que realizó el pago</summary>
    public string? UserId { get; set; }

    /// <summary>Email del usuario (desnormalizado para queries rápidas)</summary>
    public string UserEmail { get; set; } = string.Empty;

    // === Datos de Wompi ===

    /// <summary>ID de transacción devuelto por Wompi (UNIQUE)</summary>
    public string WompiTransactionId { get; set; } = string.Empty;

    /// <summary>Referencia que enviamos a Wompi (SUB-{userId8}-{timestamp})</summary>
    public string WompiReference { get; set; } = string.Empty;

    /// <summary>Monto en centavos (ej: 5000000 = $50.000 COP)</summary>
    public long AmountInCents { get; set; }

    /// <summary>Monto en COP (legible: AmountInCents / 100)</summary>
    public decimal AmountCOP { get; set; }

    /// <summary>Moneda (siempre "COP" para Colombia)</summary>
    public string Currency { get; set; } = "COP";

    /// <summary>Tipo de método de pago: CARD, PSE, NEQUI, BANCOLOMBIA_TRANSFER, etc</summary>
    public string PaymentMethodType { get; set; } = string.Empty;

    // === Estado ===

    /// <summary>Estado del pago: APPROVED, DECLINED, VOIDED, ERROR</summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>Estado raw devuelto por Wompi (respecto a lo que espera)</summary>
    public string WompiStatus { get; set; } = string.Empty;

    /// <summary>Entorno: prod o sandbox</summary>
    public string Environment { get; set; } = "prod";

    // === Webhook ===

    /// <summary>Timestamp del evento (para validar checksum)</summary>
    public long WompiEventTimestamp { get; set; }

    /// <summary>Fecha/hora cuando llegó el webhook a nuestro servidor</summary>
    public DateTime WebhookReceivedAt { get; set; }

    /// <summary>Fecha creación del registro de pago</summary>
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // === Datos de tarjeta (opcional) ===

    /// <summary>Brand: VISA, MASTERCARD, AMEX (solo si PaymentMethodType = CARD)</summary>
    public string? CardBrand { get; set; }

    /// <summary>Últimos 4 dígitos de la tarjeta (solo si PaymentMethodType = CARD)</summary>
    public string? CardLastFour { get; set; }

    // === Control y reembolsos ===

    /// <summary>¿Fue reembolsado?</summary>
    public bool IsRefunded { get; set; } = false;

    /// <summary>Fecha del reembolso (si aplica)</summary>
    public DateTime? RefundedAtUtc { get; set; }

    /// <summary>Notas internas del admin</summary>
    public string? Notes { get; set; }

    // === Navegación EF Core ===

    /// <summary>Usuario que realizó el pago (puede ser null si usuario fue eliminado)</summary>
    public UserEntity? User { get; set; }
}
