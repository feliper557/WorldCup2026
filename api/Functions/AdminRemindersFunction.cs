using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

public class AdminRemindersFunction
{
    private readonly IUserRepository _userRepository;
    private readonly IMatchRepository _matchRepository;
    private readonly IPredictionRepository _predictionRepository;
    private readonly EmailService _emailService;
    private readonly JwtService _jwtService;
    private readonly ILogger<AdminRemindersFunction> _logger;

    public AdminRemindersFunction(
        IUserRepository userRepository,
        IMatchRepository matchRepository,
        IPredictionRepository predictionRepository,
        EmailService emailService,
        JwtService jwtService,
        ILogger<AdminRemindersFunction> logger)
    {
        _userRepository = userRepository;
        _matchRepository = matchRepository;
        _predictionRepository = predictionRepository;
        _emailService = emailService;
        _jwtService = jwtService;
        _logger = logger;
    }

    [Function("AdminSendReminders")]
    public async Task<HttpResponseData> SendReminders(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/send-reminders")]
        HttpRequestData req)
    {
        _logger.LogInformation("AdminSendReminders called");

        try
        {
            var authHeader = req.Headers
                .FirstOrDefault(h => h.Key.Equals("X-Auth-Token", StringComparison.OrdinalIgnoreCase))
                .Value?.FirstOrDefault();

            if (string.IsNullOrEmpty(authHeader))
                return Error(req, "No autenticado", HttpStatusCode.Unauthorized);

            var principal = _jwtService.ValidateToken(authHeader);
            var role = _jwtService.ExtractRole(principal);
            if (role != "admin")
                return Error(req, "Acceso denegado", HttpStatusCode.Forbidden);

            // Leer fecha del body; si no se envía, usar hoy en hora Colombia (UTC-5)
            var body = await req.ReadFromJsonAsync<SendRemindersRequest>();
            DateTime todayColombia;
            if (!string.IsNullOrWhiteSpace(body?.Date) &&
                DateTime.TryParse(body.Date, out var parsedDate))
            {
                todayColombia = parsedDate.Date;
            }
            else
            {
                todayColombia = DateTime.UtcNow.AddHours(-5).Date;
            }

            var allMatches = await _matchRepository.GetAllAsync();
            var todayMatches = allMatches
                .Where(m => m.MatchDate.Date == todayColombia
                            && (m.Status == "scheduled" || m.Status == "live"))
                .ToList();

            if (todayMatches.Count == 0)
            {
                _logger.LogInformation("No hay partidos pendientes hoy ({Date})", todayColombia.ToString("yyyy-MM-dd"));
                var emptyOk = req.CreateResponse(HttpStatusCode.OK);
                await emptyOk.WriteAsJsonAsync(new SendRemindersResponse(
                    MatchesToday: 0,
                    ActiveUsers: 0,
                    UsersNotified: 0,
                    UsersAlreadyComplete: 0,
                    Details: new List<ReminderUserDetail>(),
                    Message: $"No hay partidos pendientes el {todayColombia:dd/MM/yyyy}"
                ));
                return emptyOk;
            }

            var matchIds = todayMatches.Select(m => m.Id).ToList();

            // Cargar todas las predicciones de hoy en una sola query
            var todayPredictions = await _predictionRepository.GetByMatchIdsAsync(matchIds);
            var predictedMatchesByUser = todayPredictions
                .GroupBy(p => p.UserId)
                .ToDictionary(g => g.Key, g => g.Select(p => p.MatchId).ToHashSet());

            var activeUsers = (await _userRepository.GetAllAsync())
                .Where(u => u.Status == "active" && u.Role != "admin")
                .ToList();

            var details = new List<ReminderUserDetail>();
            int notifiedCount = 0;
            int completeCount = 0;

            foreach (var user in activeUsers)
            {
                var predictedIds = predictedMatchesByUser.TryGetValue(user.Id, out var set) ? set : new HashSet<string>();
                var missingMatches = todayMatches.Where(m => !predictedIds.Contains(m.Id)).ToList();

                if (missingMatches.Count == 0)
                {
                    completeCount++;
                    details.Add(new ReminderUserDetail(user.Id, user.Email, user.DisplayName, 0, false));
                    continue;
                }

                var matchDescriptions = missingMatches
                    .OrderBy(m => m.MatchDate)
                    .Select(m =>
                    {
                        var hora = m.MatchDate.ToString("HH:mm");
                        return $"{m.HomeTeam} vs {m.AwayTeam} ({hora})";
                    })
                    .ToList();

                await _emailService.SendReminderEmailAsync(
                    email: user.Email,
                    displayName: user.DisplayName,
                    pendingCount: missingMatches.Count,
                    matchDescriptions: matchDescriptions
                );

                notifiedCount++;
                details.Add(new ReminderUserDetail(user.Id, user.Email, user.DisplayName, missingMatches.Count, true));

                _logger.LogInformation("Reminder sent to {Email} — {Missing} partidos pendientes", user.Email, missingMatches.Count);
            }

            _logger.LogInformation(
                "SendReminders complete: {Notified} notificados, {Complete} ya completos, {Matches} partidos hoy",
                notifiedCount, completeCount, todayMatches.Count);

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteAsJsonAsync(new SendRemindersResponse(
                MatchesToday: todayMatches.Count,
                ActiveUsers: activeUsers.Count,
                UsersNotified: notifiedCount,
                UsersAlreadyComplete: completeCount,
                Details: details,
                Message: notifiedCount == 0
                    ? "Todos los usuarios ya tienen sus predicciones al día"
                    : $"Se enviaron {notifiedCount} recordatorio{(notifiedCount > 1 ? "s" : "")} exitosamente"
            ));
            return ok;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en AdminSendReminders");
            return Error(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private HttpResponseData Error(HttpRequestData req, string message, HttpStatusCode status)
    {
        var response = req.CreateResponse(status);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
