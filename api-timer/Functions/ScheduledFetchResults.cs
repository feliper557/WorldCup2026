using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace api_timer.Functions;

public class ScheduledFetchResults
{
    private readonly ILogger<ScheduledFetchResults> _logger;
    private readonly HttpClient _httpClient;

    public ScheduledFetchResults(ILogger<ScheduledFetchResults> logger)
    {
        _logger = logger;
        _httpClient = new HttpClient();
    }

    [Function("ScheduledFetchResults")]
    public async Task Run([TimerTrigger("*/5 * * * *")] TimerInfo timerInfo)
    {
        try
        {
            _logger.LogInformation("⏱️ ScheduledFetchResults triggered at {time} UTC", DateTime.UtcNow);

            // Los resultados y puntos se calculan directamente en el api
            // Esta función se ejecuta cada 5 minutos
            _logger.LogInformation("✅ ScheduledFetchResults completed at {time}", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error in ScheduledFetchResults: {Message}", ex.Message);
            throw;
        }

        if (timerInfo.IsPastDue)
        {
            _logger.LogWarning("⚠️ Function is running late!");
        }
    }
}
