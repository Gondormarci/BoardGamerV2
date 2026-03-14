using BoardGamer.Domain.Entities;

namespace BoardGamer.Application.Common;

/// <summary>
/// Resolves the current authenticated user from the Keycloak JWT (sub claim) to the app User entity.
/// Creates the user on first login if they do not exist.
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Gets the current user's app ID, or null if not authenticated.
    /// </summary>
    Task<Guid?> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the current user entity, or null if not authenticated.
    /// If the user exists in Keycloak but not in the app DB, creates them (first login).
    /// </summary>
    Task<User?> GetCurrentUserAsync(CancellationToken cancellationToken = default);
}
