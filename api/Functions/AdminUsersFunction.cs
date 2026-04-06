using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;

namespace WorldCup.Api.Functions;

/// <summary>
/// Admin-only function to manage users
/// List all users, deactivate/activate users
/// </summary>
public class AdminUsersFunction
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<AdminUsersFunction> _logger;

    public AdminUsersFunction(
        IUserRepository userRepository,
        ILogger<AdminUsersFunction> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    [Function("AdminListUsers")]
    public async Task<HttpResponseData> ListUsers(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "admin/users")]
        HttpRequestData req)
    {
        _logger.LogInformation("ListUsers called");

        try
        {
            // TODO: Validate admin token when auth is properly implemented
            // For now, allow any authenticated request

            // Get all users
            var allUsers = await _userRepository.GetAllAsync();

            var users = new List<UserSummary>();
            foreach (var user in allUsers)
            {
                users.Add(new UserSummary(
                    Id: user.Id,
                    Email: user.Email,
                    DisplayName: user.DisplayName,
                    Role: user.Role,
                    Status: user.Status,
                    TotalPoints: user.TotalPoints,
                    CreatedAt: user.CreatedAtUtc,
                    LastLoginAt: user.LastLoginAtUtc
                ));
            }

            _logger.LogInformation("Listed {Count} users", users.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new ListUsersResponse(
                Users: users,
                TotalCount: users.Count
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing users");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    [Function("AdminUpdateUserStatus")]
    public async Task<HttpResponseData> UpdateUserStatus(
        [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "admin/users/{userId}/status")]
        HttpRequestData req,
        string userId)
    {
        _logger.LogInformation("UpdateUserStatus called for user {UserId}", userId);

        try
        {
            // TODO: Validate admin token when auth is properly implemented
            // For now, allow any authenticated request
            var body = await req.ReadFromJsonAsync<UpdateUserStatusRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.Status))
                return ErrorResponse(req, "Status es requerido", HttpStatusCode.BadRequest);

            var validStatuses = new[] { "active", "inactive", "banned" };
            if (!validStatuses.Contains(body.Status))
                return ErrorResponse(req, "Status inválido", HttpStatusCode.BadRequest);

            // Fetch user
            var user = await _userRepository.GetByIdAsync(userId);

            if (user == null)
                return ErrorResponse(req, "Usuario no encontrado", HttpStatusCode.NotFound);

            // Update user status
            user.Status = body.Status;
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("Updated user {UserId} status to {Status}",
                userId, body.Status);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new UpdateUserStatusResponse(
                Success: true,
                Message: $"Usuario actualizado a {body.Status}"
            ));
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user status");
            return ErrorResponse(req, ex.Message, HttpStatusCode.InternalServerError);
        }
    }

    private HttpResponseData ErrorResponse(HttpRequestData req, string message, HttpStatusCode statusCode)
    {
        var response = req.CreateResponse(statusCode);
        response.WriteAsJsonAsync(new { error = message });
        return response;
    }
}
