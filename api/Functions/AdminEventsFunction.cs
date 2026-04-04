using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;
using WorldCup.Api.Services;

namespace WorldCup.Api.Functions;

/// <summary>
/// Admin-only function to manage special events
/// Create, read, update, delete events (watch parties, meetings, activities)
/// </summary>
public class AdminEventsFunction
{
    private readonly IEventRepository _eventRepository;
    private readonly SecureTokenService _secureTokenService;
    private readonly ILogger<AdminEventsFunction> _logger;

    public AdminEventsFunction(
        IEventRepository eventRepository,
        SecureTokenService secureTokenService,
        ILogger<AdminEventsFunction> logger)
    {
        _eventRepository = eventRepository;
        _secureTokenService = secureTokenService;
        _logger = logger;
    }

    [Function("AdminCreateEvent")]
    public async Task<HttpResponseData> CreateEvent(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "admin/events")]
        HttpRequestData req)
    {
        _logger.LogInformation("CreateEvent called");

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Read request body
            var body = await req.ReadFromJsonAsync<CreateEventRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.Title))
                return ErrorResponse(req, "Título es requerido", HttpStatusCode.BadRequest);

            // 3. Create event entity
            var eventEntity = new Infrastructure.Entities.EventEntity
            {
                Id = Guid.NewGuid().ToString(),
                Title = body.Title,
                Description = body.Description,
                Type = body.Type ?? "activity",
                Date = body.Date,
                Location = body.Location,
                LocationUrl = body.LocationUrl,
                MaxCapacity = body.MaxCapacity,
                Status = "active",
                CreatedAtUtc = DateTime.UtcNow,
                CreatedBy = admin.UserId
            };

            var createdEvent = await _eventRepository.CreateAsync(eventEntity);

            _logger.LogInformation("Event created by admin {AdminId}: {EventId}", admin.UserId, createdEvent.Id);

            var response = req.CreateResponse(HttpStatusCode.Created);
            await response.WriteAsJsonAsync(MapEventToResponse(createdEvent));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating event");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminListEvents")]
    public async Task<HttpResponseData> ListEvents(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "admin/events")]
        HttpRequestData req)
    {
        _logger.LogInformation("ListEvents called");

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Get all events
            var allEvents = await _eventRepository.GetAllAsync();

            var events = new List<EventResponse>();
            foreach (var ev in allEvents)
            {
                events.Add(MapEventToResponse(ev));
            }

            _logger.LogInformation("Admin {AdminId} listed {Count} events", admin.UserId, events.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { events, total = events.Count });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing events");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminUpdateEvent")]
    public async Task<HttpResponseData> UpdateEvent(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "admin/events/{eventId}")]
        HttpRequestData req,
        string eventId)
    {
        _logger.LogInformation("UpdateEvent called for {EventId}", eventId);

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Read request body
            var body = await req.ReadFromJsonAsync<UpdateEventRequest>();

            // 3. Fetch event
            var eventEntity = await _eventRepository.GetByIdAsync(eventId);

            if (eventEntity == null)
                return ErrorResponse(req, "Evento no encontrado", HttpStatusCode.NotFound);

            // 4. Update event
            if (!string.IsNullOrWhiteSpace(body?.Title))
                eventEntity.Title = body.Title;
            if (body?.Description != null)
                eventEntity.Description = body.Description;
            if (!string.IsNullOrWhiteSpace(body?.Type))
                eventEntity.Type = body.Type;
            if (body?.Date.HasValue == true)
                eventEntity.Date = body.Date.Value;
            if (body?.Location != null)
                eventEntity.Location = body.Location;
            if (body?.LocationUrl != null)
                eventEntity.LocationUrl = body.LocationUrl;
            if (body?.MaxCapacity.HasValue == true)
                eventEntity.MaxCapacity = body.MaxCapacity;

            eventEntity.UpdatedAtUtc = DateTime.UtcNow;
            eventEntity.UpdatedBy = admin.UserId;

            var updatedEvent = await _eventRepository.UpdateAsync(eventEntity);

            _logger.LogInformation("Event updated by admin {AdminId}: {EventId}", admin.UserId, eventId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(MapEventToResponse(updatedEvent));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating event");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminDeleteEvent")]
    public async Task<HttpResponseData> DeleteEvent(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "admin/events/{eventId}")]
        HttpRequestData req,
        string eventId)
    {
        _logger.LogInformation("DeleteEvent called for {EventId}", eventId);

        try
        {
            // 1. Validate admin token
            var authHeader = req.Headers.FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
            var token = SecureTokenService.ExtractBearerToken(authHeader);
            var admin = await _secureTokenService.ValidateAdminToken(token);
            if (admin == null)
                return ErrorResponse(req, "Unauthorized", HttpStatusCode.Unauthorized);

            // 2. Fetch event
            var eventEntity = await _eventRepository.GetByIdAsync(eventId);

            if (eventEntity == null)
                return ErrorResponse(req, "Evento no encontrado", HttpStatusCode.NotFound);

            // 3. Cancel the event
            await _eventRepository.CancelAsync(eventId);

            _logger.LogInformation("Event cancelled by admin {AdminId}: {EventId}", admin.UserId, eventId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true, message = "Evento cancelado" });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting event");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private EventResponse MapEventToResponse(Infrastructure.Entities.EventEntity entity)
    {
        return new EventResponse(
            Id: entity.Id,
            Title: entity.Title,
            Description: entity.Description,
            Type: entity.Type,
            Date: entity.Date,
            Location: entity.Location,
            LocationUrl: entity.LocationUrl,
            MaxCapacity: entity.MaxCapacity,
            Status: entity.Status,
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
