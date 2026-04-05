using System.Text.Json.Serialization;

namespace WorldCup.Api.Models;

/// <summary>
/// Modelos para deserializar eventos webhook de Wompi
/// </summary>

public class WompiWebhookEvent
{
    [JsonPropertyName("event")]
    public string Event { get; set; } = string.Empty;

    [JsonPropertyName("data")]
    public WompiEventData Data { get; set; } = new();

    [JsonPropertyName("environment")]
    public string Environment { get; set; } = string.Empty;

    [JsonPropertyName("signature")]
    public WompiSignature Signature { get; set; } = new();

    [JsonPropertyName("timestamp")]
    public long Timestamp { get; set; }

    [JsonPropertyName("sent_at")]
    public string SentAt { get; set; } = string.Empty;
}

public class WompiEventData
{
    [JsonPropertyName("transaction")]
    public WompiTransaction Transaction { get; set; } = new();
}

public class WompiTransaction
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("reference")]
    public string Reference { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("amount_in_cents")]
    public long AmountInCents { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = string.Empty;

    [JsonPropertyName("customer_email")]
    public string CustomerEmail { get; set; } = string.Empty;

    [JsonPropertyName("customer_name")]
    public string CustomerName { get; set; } = string.Empty;

    [JsonPropertyName("payment_method_type")]
    public string PaymentMethodType { get; set; } = string.Empty;

    [JsonPropertyName("payment_method")]
    public WompiPaymentMethod PaymentMethod { get; set; } = new();
}

public class WompiPaymentMethod
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("brand")]
    public string Brand { get; set; } = string.Empty;

    [JsonPropertyName("last_four")]
    public string LastFour { get; set; } = string.Empty;
}

public class WompiSignature
{
    [JsonPropertyName("properties")]
    public List<string> Properties { get; set; } = new();

    [JsonPropertyName("checksum")]
    public string Checksum { get; set; } = string.Empty;
}

// === Request/Response Models ===

public class PreRegisterRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class PreRegisterResponse
{
    public string CheckoutUrl { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
