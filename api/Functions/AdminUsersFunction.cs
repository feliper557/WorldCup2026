using System.Net;
using static BCrypt.Net.BCrypt;
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
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "mgmt/users")]
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
        [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "mgmt/users/{userId}/status")]
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

    [Function("AdminResetUserPassword")]
    public async Task<HttpResponseData> ResetUserPassword(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "mgmt/users/{userId}/reset-password")]
        HttpRequestData req,
        string userId)
    {
        _logger.LogInformation("ResetUserPassword called for user {UserId}", userId);

        try
        {
            // TODO: Validate admin token when auth is properly implemented
            var body = await req.ReadFromJsonAsync<ResetUserPasswordRequest>();
            if (body == null || string.IsNullOrWhiteSpace(body.NewPassword))
                return ErrorResponse(req, "newPassword es requerido", HttpStatusCode.BadRequest);

            if (body.NewPassword.Length < 8)
                return ErrorResponse(req, "La contraseña debe tener al menos 8 caracteres", HttpStatusCode.BadRequest);

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                return ErrorResponse(req, "Usuario no encontrado", HttpStatusCode.NotFound);

            user.PasswordHash = HashPassword(body.NewPassword, 12);
            await _userRepository.UpdateAsync(user);

            _logger.LogInformation("Password reset for user {UserId}", userId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(new { success = true, message = "Contraseña actualizada" });
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting user password");
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
