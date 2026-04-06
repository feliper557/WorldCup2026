using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace api_timer.Functions;

public class ScheduledFetchResults
{
    private readonly ILogger<ScheduledFetchResults> _logger;
    private readonly HttpClient _httpClient;
    private const string BackendUrl = "https://mango-pebble-03e4a100f.2.azurestaticapps.net/api/sync-results";

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

            // Llama el endpoint del backend
            var response = await _httpClient.GetAsync(BackendUrl);

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("✅ ScheduledFetchResults completed: {content}", content);
            }
            else
            {
                _logger.LogError("❌ Backend returned {statusCode}", response.StatusCode);
            }
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
