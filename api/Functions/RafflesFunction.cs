using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Function pública para obtener y gestionar rifas
/// - GET /raffles - obtener todas las rifas
/// - POST /raffles/{id}/join - unirse a una rifa
/// - POST /raffles/{id}/draw - sortear ganador (solo admin)
/// </summary>
public class RafflesFunction
{
    private readonly IRaffleRepository _raffleRepository;
    private readonly IUserRepository _userRepository;
    private readonly SecureTokenService _secureTokenService;
    private readonly ILogger<RafflesFunction> _logger;

    public RafflesFunction(
        IRaffleRepository raffleRepository,
        IUserRepository userRepository,
        SecureTokenService secureTokenService,
        ILogger<RafflesFunction> logger)
    {
        _raffleRepository = raffleRepository;
        _userRepository = userRepository;
        _secureTokenService = secureTokenService;
        _logger = logger;
    }

    [Function("GetRaffles")]
    public async Task<HttpResponseData> GetRaffles(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "raffles")]
        HttpRequestData req)
    {
        _logger.LogInformation("GetRaffles called");

        try
        {
            var raffles = await _raffleRepository.GetAllAsync();

            // Proyectar sin referencias circulares (Participants/Winners tienen back-ref a RaffleEntity)
            var response = raffles.Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                r.Prize,
                r.Status,
                r.MaxParticipants,
                r.NumberOfWinners,
                ParticipantCount = r.Participants.Count,
                Participants = r.Participants.Select(p => new
                {
                    UserId = p.UserId,
                    DisplayName = p.User?.DisplayName ?? p.UserId,
                    JoinedAtUtc = p.AddedAt,
                    Tickets = 1
                }),
                WinnerId = r.Winners.FirstOrDefault()?.UserId,
                WinnerName = r.Winners.FirstOrDefault()?.User?.DisplayName,
                r.CreatedAtUtc,
                r.DrawAtUtc
            }).ToList();

            var httpResponse = req.CreateResponse(HttpStatusCode.OK);
            await httpResponse.WriteAsJsonAsync(response);
            return httpResponse;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error obteniendo rifas");
            var httpResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            await httpResponse.WriteAsJsonAsync(new { error = ex.Message });
            return httpResponse;
        }
    }

    [Function("JoinRaffle")]
    public async Task<HttpResponseData> JoinRaffle(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "raffles/{raffleId}/join")]
        HttpRequestData req,
        string raffleId)
    {
        _logger.LogInformation("JoinRaffle called for raffle {RaffleId}", raffleId);

        try
        {
            // 1. Obtener usuario del JWT
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            var user = await _secureTokenService.ValidateTokenAndVerifyRole(token);

            if (user == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Leer request body
            var body = await req.ReadFromJsonAsync<JoinRaffleRequest>();
            if (body == null)
                return ErrorResponse(req, "Invalid request body", HttpStatusCode.BadRequest);

            // 3. Obtener rifa
            var raffle = await _raffleRepository.GetByIdAsync(raffleId);
            if (raffle == null)
                return ErrorResponse(req, "Rifa no encontrada", HttpStatusCode.NotFound);

            if (raffle.Status != "open")
                return ErrorResponse(req, "La rifa ya no está abierta", HttpStatusCode.BadRequest);

            // 4. Agregar participante
            await _raffleRepository.AddParticipantAsync(raffleId, user.UserId);

            _logger.LogInformation("User {UserId} joined raffle {RaffleId}", user.UserId, raffleId);

            // 5. Retornar rifa actualizada
            var updatedRaffle = await _raffleRepository.GetByIdAsync(raffleId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(updatedRaffle);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining raffle");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("DrawRaffle")]
    public async Task<HttpResponseData> DrawRaffle(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "raffles/{raffleId}/draw")]
        HttpRequestData req,
        string raffleId)
    {
        _logger.LogInformation("DrawRaffle called for raffle {RaffleId}", raffleId);

        try
        {
            // 1. Validar admin
            var token = SecureTokenService.ExtractTokenFromRequest(req);
            var admin = await _secureTokenService.ValidateAdminToken(token);

            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Obtener rifa
            var raffle = await _raffleRepository.GetByIdAsync(raffleId);
            if (raffle == null)
                return ErrorResponse(req, "Rifa no encontrada", HttpStatusCode.NotFound);

            if (raffle.Participants.Count == 0)
                return ErrorResponse(req, "No hay participantes para sortear", HttpStatusCode.BadRequest);

            // 3. Seleccionar ganadores (Fisher-Yates shuffle)
            var winners = SelectRandomWinners(
                raffle.Participants.Select(p => p.UserId).ToList(),
                raffle.NumberOfWinners
            );

            // 4. Marcar como sorteado
            await _raffleRepository.SetWinnersAsync(raffleId, winners);

            _logger.LogInformation("Raffle {RaffleId} drawn with {WinnerCount} winners", raffleId, winners.Count);

            // 5. Retornar rifa actualizada
            var updatedRaffle = await _raffleRepository.GetByIdAsync(raffleId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(updatedRaffle);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error drawing raffle");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    /// <summary>
    /// Fisher-Yates shuffle para seleccionar ganadores aleatoriamente
    /// </summary>
    private List<string> SelectRandomWinners(List<string> participants, int count)
    {
        var random = new Random();
        var shuffled = new List<string>(participants);

        // Fisher-Yates
        for (int i = shuffled.Count - 1; i > 0; i--)
        {
            int randomIndex = random.Next(0, i + 1);
            (shuffled[i], shuffled[randomIndex]) = (shuffled[randomIndex], shuffled[i]);
        }

        return shuffled.Take(Math.Min(count, shuffled.Count)).ToList();
    }

    private HttpResponseData ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}

/// <summary>
/// Request para unirse a una rifa
/// </summary>
public class JoinRaffleRequest
{
    public int Tickets { get; set; } = 1;
}
