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

            // Todos los partidos del día seleccionado, sin filtrar por status
            var dayMatches = allMatches
                .Where(m => m.MatchDate.Date == todayColombia)
                .ToList();

            if (dayMatches.Count == 0)
            {
                _logger.LogInformation("No hay partidos el {Date}", todayColombia.ToString("yyyy-MM-dd"));
                var emptyOk = req.CreateResponse(HttpStatusCode.OK);
                await emptyOk.WriteAsJsonAsync(new SendRemindersResponse(
                    MatchesToday: 0,
                    ActiveUsers: 0,
                    UsersNotified: 0,
                    UsersAlreadyComplete: 0,
                    Details: new List<ReminderUserDetail>(),
                    Message: $"No hay partidos registrados el {todayColombia:dd/MM/yyyy}"
                ));
                return emptyOk;
            }

            // Solo se pueden predecir partidos que aún no han terminado
            var predictableMatches = dayMatches
                .Where(m => !m.Status.Equals("finished", StringComparison.OrdinalIgnoreCase)
                         && !m.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase)
                         && !m.Status.Equals("postponed", StringComparison.OrdinalIgnoreCase)
                         && !m.Status.Equals("suspended", StringComparison.OrdinalIgnoreCase))
                .ToList();

            var matchIds = dayMatches.Select(m => m.Id).ToList();

            // Cargar todas las predicciones del día en una sola query
            var dayPredictions = await _predictionRepository.GetByMatchIdsAsync(matchIds);
            var predictedMatchesByUser = dayPredictions
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

                // Partidos del día que el usuario no ha predicho (todos, para mostrar en tabla)
                var missingAll = dayMatches.Where(m => !predictedIds.Contains(m.Id)).ToList();

                if (missingAll.Count == 0)
                {
                    completeCount++;
                    details.Add(new ReminderUserDetail(user.Id, user.Email, user.DisplayName, 0, false));
                    continue;
                }

                // Solo enviar email por partidos que aún no han terminado
                var missingPredictable = missingAll
                    .Where(m => !m.Status.Equals("finished", StringComparison.OrdinalIgnoreCase)
                             && !m.Status.Equals("cancelled", StringComparison.OrdinalIgnoreCase)
                             && !m.Status.Equals("postponed", StringComparison.OrdinalIgnoreCase)
                             && !m.Status.Equals("suspended", StringComparison.OrdinalIgnoreCase))
                    .ToList();

                bool notified = false;
                if (missingPredictable.Count > 0)
                {
                    var matchDescriptions = missingPredictable
                        .OrderBy(m => m.MatchDate)
                        .Select(m => $"{m.HomeTeam} vs {m.AwayTeam} ({m.MatchDate:HH:mm})")
                        .ToList();

                    await _emailService.SendReminderEmailAsync(
                        email: user.Email,
                        displayName: user.DisplayName,
                        pendingCount: missingPredictable.Count,
                        matchDescriptions: matchDescriptions
                    );

                    // 250 ms entre envíos → máximo 4 emails/segundo (límite Resend: 5/s)
                    await Task.Delay(250);

                    notifiedCount++;
                    notified = true;
                    _logger.LogInformation("Reminder sent to {Email} — {Missing} partidos pendientes", user.Email, missingPredictable.Count);
                }

                details.Add(new ReminderUserDetail(user.Id, user.Email, user.DisplayName, missingAll.Count, notified));
            }

            _logger.LogInformation(
                "SendReminders complete: {Notified} notificados, {Complete} ya completos, {Matches} partidos el día",
                notifiedCount, completeCount, dayMatches.Count);

            string message;
            if (predictableMatches.Count == 0)
                message = $"Todos los partidos del {todayColombia:dd/MM/yyyy} ya han terminado — no se enviaron recordatorios";
            else if (notifiedCount == 0)
                message = "Todos los usuarios ya tienen sus predicciones al día";
            else
                message = $"Se enviaron {notifiedCount} recordatorio{(notifiedCount > 1 ? "s" : "")} exitosamente";

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteAsJsonAsync(new SendRemindersResponse(
                MatchesToday: dayMatches.Count,
                ActiveUsers: activeUsers.Count,
                UsersNotified: notifiedCount,
                UsersAlreadyComplete: completeCount,
                Details: details,
                Message: message
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
