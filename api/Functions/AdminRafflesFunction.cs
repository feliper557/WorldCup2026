using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Admin-only function to manage raffles
/// Create, list, add/remove participants, execute draws
/// Supports multiple participation modes: all, first_N, manual, gender
/// Draw algorithm: Fisher-Yates shuffle for random selection
/// </summary>
public class AdminRafflesFunction
{
    private readonly IRaffleRepository _raffleRepository;
    private readonly IUserRepository _userRepository;
    private readonly SecureTokenService _secureTokenService;
    private readonly ILogger<AdminRafflesFunction> _logger;

    public AdminRafflesFunction(
        IRaffleRepository raffleRepository,
        IUserRepository userRepository,
        SecureTokenService secureTokenService,
        ILogger<AdminRafflesFunction> logger)
    {
        _raffleRepository = raffleRepository;
        _userRepository = userRepository;
        _secureTokenService = secureTokenService;
        _logger = logger;
    }

    [Function("AdminCreateRaffle")]
    public async Task<HttpResponseData> CreateRaffle(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "admin/raffles")]
        HttpRequestData req)
    {
        _logger.LogInformation("CreateRaffle called");

        try
        {
            // 1. Validate admin token
            var admin = await ValidateAdminRequest(req);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Read request body
            var body = await req.ReadFromJsonAsync<CreateRaffleRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.Title))
                return ErrorResponse(req, "Título es requerido", HttpStatusCode.BadRequest);

            // 3. If mode is first_N, get first N users
            var participants = new List<string>();
            if (body.ParticipationMode == "first_N" && body.MaxParticipants.HasValue)
            {
                participants = await GetFirstNUsersFromRepo(body.MaxParticipants.Value);
            }
            else if (body.ParticipationMode == "gender" && !string.IsNullOrWhiteSpace(body.TargetGender))
            {
                participants = await GetUsersByGenderFromRepo(body.TargetGender);
            }
            // For "all" and "manual", participants list starts empty
            // "all" will get all users during draw
            // "manual" expects participants to be added via POST /participants

            // 4. Create raffle entity
            var participantEntities = participants.Select(p => new Infrastructure.Entities.RaffleParticipantEntity
            {
                UserId = p,
                AddedAt = DateTime.UtcNow
            }).ToList();

            var raffleEntity = new Infrastructure.Entities.RaffleEntity
            {
                Id = Guid.NewGuid().ToString(),
                Title = body.Title,
                Description = body.Description,
                Prize = body.Prize,
                NumberOfWinners = body.NumberOfWinners,
                ParticipationMode = body.ParticipationMode ?? "all",
                MaxParticipants = body.MaxParticipants,
                TargetGender = body.TargetGender,
                Participants = participantEntities,
                Status = "open",
                CreatedAtUtc = DateTime.UtcNow,
                CreatedBy = admin.UserId
            };

            var createdRaffle = await _raffleRepository.CreateAsync(raffleEntity);

            _logger.LogInformation("Raffle created by admin {AdminId}: {RaffleId} with {Count} participants",
                admin.UserId, createdRaffle.Id, participants.Count);

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(MapRaffleToResponse(createdRaffle));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating raffle");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminListRaffles")]
    public async Task<HttpResponseData> ListRaffles(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "admin/raffles")]
        HttpRequestData req)
    {
        _logger.LogInformation("ListRaffles called");

        try
        {
            var admin = await ValidateAdminRequest(req);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            var allRaffles = await _raffleRepository.GetAllAsync();

            var raffles = new List<RaffleResponse>();
            foreach (var raffle in allRaffles)
            {
                raffles.Add(MapRaffleToResponse(raffle));
            }

            _logger.LogInformation("Admin {AdminId} listed {Count} raffles", admin.UserId, raffles.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new ListRafflesResponse(raffles, raffles.Count));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing raffles");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminGetRaffle")]
    public async Task<HttpResponseData> GetRaffle(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "admin/raffles/{raffleId}")]
        HttpRequestData req,
        string raffleId)
    {
        _logger.LogInformation("GetRaffle called for {RaffleId}", raffleId);

        try
        {
            var admin = await ValidateAdminRequest(req);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            var raffle = await _raffleRepository.GetByIdAsync(raffleId);
            if (raffle == null)
                return ErrorResponse(req, "Rifa no encontrada", HttpStatusCode.NotFound);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(MapRaffleToResponse(raffle));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting raffle");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminAddRaffleParticipant")]
    public async Task<HttpResponseData> AddParticipant(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "admin/raffles/{raffleId}/participants")]
        HttpRequestData req,
        string raffleId)
    {
        _logger.LogInformation("AddParticipant called for raffle {RaffleId}", raffleId);

        try
        {
            var admin = await ValidateAdminRequest(req);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            var body = await req.ReadFromJsonAsync<AddRaffleParticipantRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.UserId))
                return ErrorResponse(req, "UserId es requerido", HttpStatusCode.BadRequest);

            var raffle = await _raffleRepository.GetByIdAsync(raffleId);
            if (raffle == null)
                return ErrorResponse(req, "Rifa no encontrada", HttpStatusCode.NotFound);

            if (!raffle.IsModifiable)
                return ErrorResponse(req, "La rifa ya fue sorteada", HttpStatusCode.BadRequest);

            await _raffleRepository.AddParticipantAsync(raffleId, body.UserId);

            _logger.LogInformation("Participant {UserId} added to raffle {RaffleId} by admin {AdminId}",
                body.UserId, raffleId, admin.UserId);

            var updatedRaffle = await _raffleRepository.GetByIdAsync(raffleId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true, participantCount = updatedRaffle?.Participants.Count ?? 0 });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding participant");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminRemoveRaffleParticipant")]
    public async Task<HttpResponseData> RemoveParticipant(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "admin/raffles/{raffleId}/participants/{userId}")]
        HttpRequestData req,
        string raffleId,
        string userId)
    {
        _logger.LogInformation("RemoveParticipant called for raffle {RaffleId}, user {UserId}", raffleId, userId);

        try
        {
            var admin = await ValidateAdminRequest(req);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            var raffle = await _raffleRepository.GetByIdAsync(raffleId);
            if (raffle == null)
                return ErrorResponse(req, "Rifa no encontrada", HttpStatusCode.NotFound);

            if (!raffle.IsModifiable)
                return ErrorResponse(req, "La rifa ya fue sorteada", HttpStatusCode.BadRequest);

            await _raffleRepository.RemoveParticipantAsync(raffleId, userId);

            _logger.LogInformation("Participant {UserId} removed from raffle {RaffleId} by admin {AdminId}",
                userId, raffleId, admin.UserId);

            var updatedRaffle = await _raffleRepository.GetByIdAsync(raffleId);
            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true, participantCount = updatedRaffle?.Participants.Count ?? 0 });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing participant");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminDrawRaffle")]
    public async Task<HttpResponseData> DrawRaffle(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "admin/raffles/{raffleId}/draw")]
        HttpRequestData req,
        string raffleId)
    {
        _logger.LogInformation("DrawRaffle called for {RaffleId}", raffleId);

        try
        {
            var admin = await ValidateAdminRequest(req);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            var raffle = await _raffleRepository.GetByIdAsync(raffleId);
            if (raffle == null)
                return ErrorResponse(req, "Rifa no encontrada", HttpStatusCode.NotFound);

            if (!raffle.IsModifiable)
                return ErrorResponse(req, "La rifa ya fue sorteada", HttpStatusCode.BadRequest);

            // Get all participants based on mode
            var finalParticipants = new List<string>();

            if (raffle.ParticipationMode == "all")
            {
                finalParticipants = await GetAllActiveUsersFromRepo();
            }
            else
            {
                finalParticipants = raffle.Participants.Select(p => p.UserId).ToList();
            }

            if (finalParticipants.Count == 0)
                return ErrorResponse(req, "No hay participantes para el sorteo", HttpStatusCode.BadRequest);

            if (finalParticipants.Count < raffle.NumberOfWinners)
                return ErrorResponse(req,
                    $"Hay {finalParticipants.Count} participantes pero se esperaban {raffle.NumberOfWinners} ganadores",
                    HttpStatusCode.BadRequest);

            // Execute draw
            var winners = raffle.ExecuteDraw(raffle.NumberOfWinners);

            // Get winner details
            var winnerDetails = new List<RaffleWinner>();
            foreach (var winnerId in winners)
            {
                var user = await _userRepository.GetByIdAsync(winnerId);
                if (user != null)
                {
                    winnerDetails.Add(new RaffleWinner(user.Id, user.DisplayName, user.Email));
                }
            }

            await _raffleRepository.SetWinnersAsync(raffleId, winners);

            _logger.LogInformation("Raffle {RaffleId} drawn by admin {AdminId}. Winners: {WinnerCount}",
                raffleId, admin.UserId, winners.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new DrawRaffleResponse(
                Success: true,
                Message: $"Sorteo completado con {winners.Count} ganador(es)",
                Winners: winnerDetails
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error drawing raffle");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    // Helper methods

    private async Task<UserContext?> ValidateAdminRequest(HttpRequestData req)
    {
        var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
        var token = SecureTokenService.ExtractBearerToken(authHeader);
        return await _secureTokenService.ValidateAdminToken(token);
    }

    private async Task<List<string>> GetFirstNUsersFromRepo(int maxCount)
    {
        var allUsers = await _userRepository.GetAllAsync();
        return allUsers.Take(maxCount).Select(u => u.Id).ToList();
    }

    private async Task<List<string>> GetUsersByGenderFromRepo(string targetGender)
    {
        var allUsers = await _userRepository.GetAllAsync();
        return allUsers
            .Where(u => u.Gender == targetGender)
            .Select(u => u.Id)
            .ToList();
    }

    private async Task<List<string>> GetAllActiveUsersFromRepo()
    {
        var allUsers = await _userRepository.GetAllAsync();
        return allUsers
            .Where(u => u.Status == "active")
            .Select(u => u.Id)
            .ToList();
    }

    /// <summary>
    /// Fisher-Yates shuffle algorithm to randomly select winners
    /// </summary>
    private List<string> ExecuteDraw(List<string> participantIds, int numberOfWinners)
    {
        var pool = new List<string>(participantIds);
        var winners = new List<string>();
        var rng = new Random();

        for (int i = 0; i < numberOfWinners && pool.Count > 0; i++)
        {
            int index = rng.Next(pool.Count);
            winners.Add(pool[index]);
            pool.RemoveAt(index);  // Sin reemplazo
        }

        return winners;
    }

    private RaffleResponse MapRaffleToResponse(Infrastructure.Entities.RaffleEntity entity)
    {
        var participantIds = entity.Participants.Select(p => p.UserId).ToList();
        var winnerIds = entity.Winners.Select(w => w.UserId).ToList();

        return new RaffleResponse(
            Id: entity.Id,
            Title: entity.Title,
            Description: entity.Description,
            Prize: entity.Prize,
            NumberOfWinners: entity.NumberOfWinners,
            ParticipationMode: entity.ParticipationMode,
            MaxParticipants: entity.MaxParticipants,
            TargetGender: entity.TargetGender,
            ParticipantCount: entity.Participants.Count,
            Participants: participantIds,
            Winners: winnerIds,
            Status: entity.Status,
            DrawAt: entity.DrawAtUtc,
            CreatedAt: entity.CreatedAtUtc,
            CreatedBy: entity.CreatedBy
        );
    }

    private HttpResponseData ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
