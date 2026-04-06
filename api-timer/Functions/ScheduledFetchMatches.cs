using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace api_timer.Functions;

public class ScheduledFetchMatches
{
    private readonly ILogger<ScheduledFetchMatches> _logger;
    private readonly HttpClient _httpClient;
    private const string BackendUrl = "https://mango-pebble-03e4a100f.2.azurestaticapps.net/api/sync-matches";

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

            // Llama el endpoint del backend
            var response = await _httpClient.GetAsync(BackendUrl);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("✅ ScheduledFetchMatches completed: {content}", content);
            }
            else
            {
                _logger.LogError("❌ Backend returned {statusCode}", response.StatusCode);
            }
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
