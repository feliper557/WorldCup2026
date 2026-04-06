using System.Text.Json.Serialization;

namespace WorldCup.Api.Models;

/// <summary>
/// Request to create an invitation
/// </summary>
public record CreateInvitationRequest(
    string Email,
    string NotificationChannel = "email",
    string? PhoneNumber = null
);

/// <summary>
/// Request to send notification with invitation link
/// </summary>
public record SendNotificationRequest(
    string Email,
    string? Phone,
    string Link,
    string Channel
);

/// <summary>
/// Request to validate invitation token
/// </summary>
public record ValidateInvitationRequest(string Token);

/// <summary>
/// Request to register user with invitation token
/// </summary>
public record RegisterUserRequest(
    string Token,
    string Name,
    string Password
);

/// <summary>
/// Response for successful token validation
/// </summary>
public record ValidateInvitationResponse(
    bool Valid,
    string? Email = null,
    string? Message = null
);

/// <summary>
/// Response for successful user registration
/// </summary>
public record RegisterUserResponse(
    bool Success,
    string? UserId = null,
    string? Email = null,
    string? Message = null,
    string? Token = null
);

/// <summary>
/// Response for successful invitation creation
/// </summary>
public record CreateInvitationResponse(
    string Link,
    DateTime ExpiresAt,
    string InvitationCode
);

/// <summary>
/// Response for login
/// </summary>
public record LoginResponse(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("userId")] string? UserId = null,
    [property: JsonPropertyName("email")] string? Email = null,
    [property: JsonPropertyName("token")] string? Token = null,
    [property: JsonPropertyName("message")] string? Message = null,
    [property: JsonPropertyName("user")] UserProfileResponse? User = null
);

/// <summary>
/// User profile in responses
/// </summary>
public record UserProfileResponse(
    string Id,
    string Email,
    string DisplayName,
    string Role,
    int TotalPoints,
    int TotalPredictions,
    int CorrectPredictions,
    double AccuracyPercentage,
    int? LeaderboardRank
);
