using System.Security.Claims;
using BoardGamer.Application.Common;
using Microsoft.AspNetCore.Http;
using BoardGamer.Domain.Entities;
using BoardGamer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BoardGamer.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly BoardGamerDbContext _db;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, BoardGamerDbContext db)
    {
        _httpContextAccessor = httpContextAccessor;
        _db = db;
    }

    public async Task<Guid?> GetCurrentUserIdAsync(CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        return user?.Id;
    }

    public async Task<User?> GetCurrentUserAsync(CancellationToken cancellationToken = default)
    {
        var sub = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");
        if (string.IsNullOrEmpty(sub))
            return null;

        var user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.KeycloakSubjectId == sub, cancellationToken)
            .ConfigureAwait(false);

        if (user != null)
            return user;

        // First login: create user from Keycloak claims
        var preferredUsername = _httpContextAccessor.HttpContext?.User?.FindFirstValue("preferred_username");
        var username = !string.IsNullOrEmpty(preferredUsername) ? preferredUsername : sub;

        user = new User
        {
            Id = Guid.NewGuid(),
            KeycloakSubjectId = sub,
            Username = username.Length > 256 ? username[..256] : username,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return user;
    }
}
