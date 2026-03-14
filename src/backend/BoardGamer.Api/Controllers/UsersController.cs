using Asp.Versioning;
using BoardGamer.Application.Common;
using BoardGamer.Contracts.Users;
using BoardGamer.Domain.Entities;
using BoardGamer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BoardGamer.Api.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ICurrentUserService _currentUser;
    private readonly BoardGamerDbContext _db;

    public UsersController(ICurrentUserService currentUser, BoardGamerDbContext db)
    {
        _currentUser = currentUser;
        _db = db;
    }

    /// <summary>
    /// Gets the current authenticated user's profile.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileResponse>> GetMe(CancellationToken cancellationToken)
    {
        var user = await _currentUser.GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Unauthorized();

        var profile = await BuildProfileResponseAsync(user.Id, cancellationToken).ConfigureAwait(false);
        return Ok(profile);
    }

    /// <summary>
    /// Updates the current user's profile (e.g. Bio).
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<UserProfileResponse>> PutMe(
        [FromBody] UpdateMyProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _currentUser.GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        if (user == null)
            return Unauthorized();

        if (request.Bio != null && request.Bio.Length > 2000)
            return BadRequest("Bio must be at most 2000 characters.");

        var entity = await _db.Users.FindAsync([user.Id], cancellationToken).ConfigureAwait(false);
        if (entity == null)
            return Unauthorized();

        entity.Bio = request.Bio;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var profile = await BuildProfileResponseAsync(entity.Id, cancellationToken).ConfigureAwait(false);
        return Ok(profile);
    }

    /// <summary>
    /// Gets a user's public profile by id.
    /// </summary>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(UserProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserProfileResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var exists = await _db.Users.AnyAsync(u => u.Id == id, cancellationToken).ConfigureAwait(false);
        if (!exists)
            return NotFound();

        var profile = await BuildProfileResponseAsync(id, cancellationToken).ConfigureAwait(false);
        return Ok(profile);
    }

    private async Task<UserProfileResponse> BuildProfileResponseAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .AsNoTracking()
            .FirstAsync(u => u.Id == userId, cancellationToken)
            .ConfigureAwait(false);

        var hostReviewCount = await _db.Reviews
            .CountAsync(r => r.TargetUserId == userId && r.RatingType == RatingType.Host, cancellationToken)
            .ConfigureAwait(false);
        var playerReviewCount = await _db.Reviews
            .CountAsync(r => r.TargetUserId == userId && r.RatingType == RatingType.Player, cancellationToken)
            .ConfigureAwait(false);
        var hostRating = hostReviewCount > 0
            ? await _db.Reviews
                .Where(r => r.TargetUserId == userId && r.RatingType == RatingType.Host)
                .AverageAsync(r => r.Rating, cancellationToken)
                .ConfigureAwait(false)
            : 0.0;
        var playerRating = playerReviewCount > 0
            ? await _db.Reviews
                .Where(r => r.TargetUserId == userId && r.RatingType == RatingType.Player)
                .AverageAsync(r => r.Rating, cancellationToken)
                .ConfigureAwait(false)
            : 0.0;
        var eventsHostedCount = await _db.Events
            .CountAsync(e => e.HostUserId == userId, cancellationToken)
            .ConfigureAwait(false);
        var eventsAttendedCount = await _db.EventParticipants
            .CountAsync(p => p.UserId == userId && p.Role == ParticipantRole.Player, cancellationToken)
            .ConfigureAwait(false);

        return new UserProfileResponse
        {
            Id = user.Id,
            Username = user.Username,
            Bio = user.Bio,
            HostRating = Math.Round(hostRating, 2),
            HostReviewCount = hostReviewCount,
            PlayerRating = Math.Round(playerRating, 2),
            PlayerReviewCount = playerReviewCount,
            EventsHostedCount = eventsHostedCount,
            EventsAttendedCount = eventsAttendedCount
        };
    }
}
