using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace api_timer.Functions;

public class ScheduledFetchMatches
{
    private readonly ILogger<ScheduledFetchMatches> _logger;
    private readonly HttpClient _httpClient;

    public ScheduledFetchMatches(ILogger<ScheduledFetchMatches> logger)
    {
        _logger = logger;
        _httpClient = new HttpClient();
    }

    [Function("ScheduledFetchMatches")]
    public async Task Run([TimerTrigger("0 3 * * *")] TimerInfo timerInfo)
    {
        try
        {
            _logger.LogInformation("🔄 ScheduledFetchMatches triggered at {time} UTC", DateTime.UtcNow);

            // Los datos se cargan directamente en el api
            // Esta función se ejecuta diariamente a las 3 AM
            _logger.LogInformation("✅ ScheduledFetchMatches completed at {time}", DateTime.UtcNow);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error in ScheduledFetchMatches: {Message}", ex.Message);
            throw;
        }

        if (timerInfo.IsPastDue)
        {
            _logger.LogWarning("⚠️ Function is running late!");
        }
    }
}
