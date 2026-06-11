namespace WorldCup.Api.Models;

/// <summary>
/// Request to resend an invitation with a new token and expiration
/// </summary>
public record ResendInvitationRequest(string InvitationId);

/// <summary>
/// Response for resending invitation
/// </summary>
public record ResendInvitationResponse(
    bool Success,
    string? Message = null,
    string? NewLink = null,
    DateTime? NewExpiresAt = null
);

/// <summary>
/// Response for listing users
/// </summary>
public record ListUsersResponse(
    List<UserSummary> Users,
    int TotalCount
);

/// <summary>
/// Summary of a user (for admin listing)
/// </summary>
public record UserSummary(
    string Id,
    string Email,
    string DisplayName,
    string Role,
    string Status,
    int TotalPoints,
    DateTime CreatedAt,
    DateTime? LastLoginAt
);

/// <summary>
/// Request to deactivate/activate a user
/// </summary>
public record UpdateUserStatusRequest(string Status);

/// <summary>
/// Request to reset a user's password (admin action — no current-password check)
/// </summary>
public record ResetUserPasswordRequest(string NewPassword);

/// <summary>
/// Response for user status update
/// </summary>
public record UpdateUserStatusResponse(
    bool Success,
    string? Message = null
);

/// <summary>
/// Request to create a special event
/// </summary>
public record CreateEventRequest(
    string Title,
    string? Description,
    string Type,
    DateTime Date,
    string? Location,
    string? LocationUrl,
    int? MaxCapacity
);

/// <summary>
/// Request to update a special event
/// </summary>
public record UpdateEventRequest(
    string? Title,
    string? Description,
    string? Type,
    DateTime? Date,
    string? Location,
    string? LocationUrl,
    int? MaxCapacity
);

/// <summary>
/// Response with event details
/// </summary>
public record EventResponse(
    string Id,
    string Title,
    string? Description,
    string Type,
    DateTime Date,
    string? Location,
    string? LocationUrl,
    int? MaxCapacity,
    string Status,
    DateTime CreatedAt,
    string CreatedBy
);

/// <summary>
/// Request to create a raffle
/// </summary>
public record CreateRaffleRequest(
    string Title,
    string? Description,
    string Prize,
    int NumberOfWinners,
    string ParticipationMode,
    int? MaxParticipants,
    string? TargetGender
);

/// <summary>
/// Request to add a participant to a raffle
/// </summary>
public record AddRaffleParticipantRequest(string UserId);

/// <summary>
/// Response for raffle draw execution
/// </summary>
public record DrawRaffleResponse(
    bool Success,
    string? Message = null,
    List<RaffleWinner>? Winners = null
);

/// <summary>
/// Winner of a raffle
/// </summary>
public record RaffleWinner(
    string UserId,
    string DisplayName,
    string Email
);

/// <summary>
/// Response with raffle details
/// </summary>
public record RaffleResponse(
    string Id,
    string Title,
    string? Description,
    string Prize,
    int NumberOfWinners,
    string ParticipationMode,
    int? MaxParticipants,
    string? TargetGender,
    int ParticipantCount,
    List<string> Participants,
    List<string> Winners,
    string Status,
    DateTime? DrawAt,
    DateTime CreatedAt,
    string CreatedBy
);

/// <summary>
/// Response for listing raffles
/// </summary>
public record ListRafflesResponse(
    List<RaffleResponse> Raffles,
    int TotalCount
);

/// <summary>
/// Request body for sending reminders — date is optional (yyyy-MM-dd), defaults to today (Colombia time)
/// </summary>
public record SendRemindersRequest(string? Date);

/// <summary>
/// Detail of a single user notified (or skipped) in a reminder run
/// </summary>
public record ReminderUserDetail(
    string UserId,
    string Email,
    string DisplayName,
    int MissingCount,
    bool Notified
);

/// <summary>
/// Response after sending reminders to users with pending predictions today
/// </summary>
public record SendRemindersResponse(
    int MatchesToday,
    int ActiveUsers,
    int UsersNotified,
    int UsersAlreadyComplete,
    List<ReminderUserDetail> Details,
    string Message
);
