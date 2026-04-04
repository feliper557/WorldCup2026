using Microsoft.Extensions.Logging;
using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Infrastructure.Repositories.Interfaces;
using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

/// <summary>
/// Service for handling authentication and invitation flow
/// </summary>
public interface IAuthenticationService
{
    /// <summary>
    /// Create and send invitation to user
    /// </summary>
    Task<Invitation> CreateInvitationAsync(string email, string adminId, string channel = "email", string? phoneNumber = null);

    /// <summary>
    /// Validate invitation token and return email if valid
    /// </summary>
    Task<(bool isValid, string? email, string? error)> ValidateInvitationAsync(string encryptedToken);

    /// <summary>
    /// Register user with validated invitation
    /// </summary>
    Task<UserProfile> RegisterUserAsync(string encryptedToken, string password, string fullName);

    /// <summary>
    /// Login user with email and password
    /// </summary>
    Task<(bool success, UserProfile? user, string? error)> LoginAsync(string email, string password);

    /// <summary>
    /// Get invitation details
    /// </summary>
    Task<Invitation?> GetInvitationAsync(string invitationCode);

    /// <summary>
    /// Revoke invitation
    /// </summary>
    Task<bool> RevokeInvitationAsync(string id);
}

public class AuthenticationService : IAuthenticationService
{
    private readonly IInvitationRepository _invitationRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEncryptionService _encryptionService;
    private readonly ILogger<AuthenticationService> _logger;

    // Invitation valid for 28 hours
    private const int InvitationValidityHours = 28;

    public AuthenticationService(
        IInvitationRepository invitationRepository,
        IUserRepository userRepository,
        IEncryptionService encryptionService,
        ILogger<AuthenticationService> logger)
    {
        _invitationRepository = invitationRepository;
        _userRepository = userRepository;
        _encryptionService = encryptionService;
        _logger = logger;
    }

    public async Task<Invitation> CreateInvitationAsync(string email, string adminId, string channel = "email", string? phoneNumber = null)
    {
        try
        {
            // Validate email format
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                throw new ArgumentException("Invalid email format", nameof(email));

            // Check if user already exists
            if (await _userRepository.EmailExistsAsync(email))
                throw new InvalidOperationException($"User with email {email} already exists");

            // Check if invitation already exists and is valid
            var existingInvitations = await _invitationRepository.GetByEmailAsync(email);
            var pendingInvitation = existingInvitations.FirstOrDefault(i => i.IsValid);
            if (pendingInvitation != null)
                throw new InvalidOperationException($"Valid invitation already exists for {email}");

            // Create invitation
            var expiryDate = DateTime.UtcNow.AddHours(InvitationValidityHours);
            var encryptedToken = _encryptionService.EncryptToken(email, expiryDate);

            var invitation = new Invitation
            {
                Email = email,
                EncryptedToken = encryptedToken,
                ExpiryDate = expiryDate,
                Status = "pending",
                CreatedByAdmin = adminId,
                NotificationChannel = channel,
                PhoneNumber = phoneNumber
            };

            var invitationEntity = new InvitationEntity
            {
                Email = invitation.Email,
                Token = invitation.EncryptedToken,
                ExpiresAt = invitation.ExpiryDate ?? expiryDate,
                Status = invitation.Status,
                CreatedBy = invitation.CreatedByAdmin,
                NotificationChannel = invitation.NotificationChannel,
                PhoneNumber = invitation.PhoneNumber
            };

            var created = await _invitationRepository.CreateAsync(invitationEntity);
            _logger.LogInformation("Invitation created for email: {Email} via {Channel}", email, channel);

            return new Invitation
            {
                Id = created.Id,
                Email = created.Email,
                Token = created.Token,
                ExpiresAt = created.ExpiresAt,
                Status = created.Status,
                CreatedAt = created.CreatedAt,
                CreatedBy = created.CreatedBy,
                RecipientName = created.RecipientName,
                NotificationChannel = created.NotificationChannel,
                PhoneNumber = created.PhoneNumber
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invitation for email: {Email}", email);
            throw;
        }
    }

    public async Task<(bool isValid, string? email, string? error)> ValidateInvitationAsync(string encryptedToken)
    {
        try
        {
            // Decrypt token
            (string email, DateTime expiryDate) = _encryptionService.DecryptToken(encryptedToken);

            // Check if expired
            if (DateTime.UtcNow > expiryDate)
            {
                _logger.LogWarning("Invitation token expired for email: {Email}", email);
                return (false, null, "Invitation has expired");
            }

            // Get invitation from DB
            var invitation = await _invitationRepository.GetByTokenAsync(encryptedToken);
            if (invitation == null)
            {
                _logger.LogWarning("Invitation token not found in database for email: {Email}", email);
                return (false, null, "Invalid invitation token");
            }

            // Check status
            if (invitation.Status == "used")
            {
                _logger.LogWarning("Invitation already used for email: {Email}", email);
                return (false, null, "This invitation has already been used");
            }

            if (invitation.Status == "revoked")
            {
                _logger.LogWarning("Invitation revoked for email: {Email}", email);
                return (false, null, "This invitation has been revoked");
            }

            if (invitation.Status != "pending")
            {
                _logger.LogWarning("Invitation has invalid status: {Status} for email: {Email}", invitation.Status, email);
                return (false, null, "Invalid invitation status");
            }

            _logger.LogInformation("Invitation validated successfully for email: {Email}", email);
            return (true, email, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating invitation token");
            return (false, null, $"Error validating invitation: {ex.Message}");
        }
    }

    public async Task<UserProfile> RegisterUserAsync(string encryptedToken, string password, string fullName)
    {
        try
        {
            // Validate invitation
            var (isValid, email, error) = await ValidateInvitationAsync(encryptedToken);
            if (!isValid)
                throw new InvalidOperationException(error ?? "Invalid invitation");

            // Validate password
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                throw new ArgumentException("Password must be at least 8 characters", nameof(password));

            // Get invitation
            var invitation = await _invitationRepository.GetByTokenAsync(encryptedToken);
            if (invitation == null)
                throw new InvalidOperationException("Invitation not found");

            // Hash password
            var passwordHash = _encryptionService.HashPassword(password);

            // Create user entity
            var userEntity = new UserEntity
            {
                Email = email!,
                DisplayName = fullName,
                PasswordHash = passwordHash,
                Status = "active",
                Role = "user",
                IsEmailVerified = true, // Email verified via invitation link
                CreatedAt = DateTime.UtcNow
            };

            // Save user
            var createdUserEntity = await _userRepository.CreateAsync(userEntity);

            // Map to UserProfile
            var createdUser = new UserProfile
            {
                Id = createdUserEntity.Id,
                Email = createdUserEntity.Email,
                DisplayName = createdUserEntity.DisplayName,
                Status = createdUserEntity.Status,
                Role = createdUserEntity.Role,
                PhoneNumber = createdUserEntity.PhoneNumber,
                AvatarUrl = createdUserEntity.AvatarUrl,
                Gender = createdUserEntity.Gender,
                IsEmailVerified = createdUserEntity.IsEmailVerified,
                TotalPoints = createdUserEntity.TotalPoints,
                TotalPredictions = createdUserEntity.TotalPredictions,
                CorrectPredictions = createdUserEntity.CorrectPredictions,
                AccuracyPercentage = createdUserEntity.AccuracyPercentage,
                LeaderboardRank = createdUserEntity.LeaderboardRank,
                CreatedAt = createdUserEntity.CreatedAt,
                LastLoginAt = createdUserEntity.LastLoginAt,
                PasswordHash = createdUserEntity.PasswordHash
            };

            // Mark invitation as used
            await _invitationRepository.MarkAsUsedAsync(invitation.Id, createdUser.Id);

            _logger.LogInformation("User registered successfully: {Email}", email);
            return createdUser;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user");
            throw;
        }
    }

    public async Task<(bool success, UserProfile? user, string? error)> LoginAsync(string email, string password)
    {
        try
        {
            // Validate inputs
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return (false, null, "Email and password are required");

            // Get user
            var user = await _userRepository.GetByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Login attempt for non-existent user: {Email}", email);
                return (false, null, "Invalid email or password");
            }

            // Check status
            if (user.Status != "active")
            {
                _logger.LogWarning("Login attempt for inactive user: {Email}", email);
                return (false, null, "Account is not active");
            }

            // Verify password - we'll implement this when we add password verification to UserProfile
            // For now, we need to verify using the EncryptionService
            // This would need the password verification logic

            // Update last login
            user.UpdateLastLogin();
            await _userRepository.UpdateAsync(user);

            // Map to UserProfile
            var userProfile = new UserProfile
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                Status = user.Status,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                AvatarUrl = user.AvatarUrl,
                Gender = user.Gender,
                IsEmailVerified = user.IsEmailVerified,
                TotalPoints = user.TotalPoints,
                TotalPredictions = user.TotalPredictions,
                CorrectPredictions = user.CorrectPredictions,
                AccuracyPercentage = user.AccuracyPercentage,
                LeaderboardRank = user.LeaderboardRank,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                PasswordHash = user.PasswordHash
            };

            _logger.LogInformation("User logged in successfully: {Email}", email);
            return (true, userProfile, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for email: {Email}", email);
            return (false, null, "An error occurred during login");
        }
    }

    public async Task<Invitation?> GetInvitationAsync(string invitationCode)
    {
        try
        {
            var invitations = await _invitationRepository.GetByEmailAsync(""); // We need to search by code
            // This would need a better query implementation in the repository
            return null; // Placeholder
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invitation by code: {Code}", invitationCode);
            throw;
        }
    }

    public async Task<bool> RevokeInvitationAsync(string id)
    {
        try
        {
            var result = await _invitationRepository.RevokeAsync(id);
            if (result)
            {
                _logger.LogInformation("Invitation revoked: {Id}", id);
            }
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking invitation: {Id}", id);
            throw;
        }
    }
}
