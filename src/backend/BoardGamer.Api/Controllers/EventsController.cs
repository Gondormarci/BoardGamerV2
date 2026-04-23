using Asp.Versioning;
using BoardGamer.Application.Common;
using BoardGamer.Contracts.Events;
using BoardGamer.Domain.Entities;
using BoardGamer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BoardGamer.Api.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
public class EventsController : ControllerBase
{
    private readonly ICurrentUserService _currentUser;
    private readonly BoardGamerDbContext _db;

    public EventsController(ICurrentUserService currentUser, BoardGamerDbContext db)
    {
        _currentUser = currentUser;
        _db = db;
    }

    // GET /api/v1/events
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(EventSummaryResponse[]), StatusCodes.Status200OK)]
    public async Task<ActionResult<EventSummaryResponse[]>> GetEvents(
        [FromQuery] string? location,
        [FromQuery] string? gameName,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] int? minPlayers,
        [FromQuery] int? maxPlayers,
        [FromQuery] double? hostRatingMin,
        [FromQuery] string? hostedBy,
        [FromQuery] string? joinedBy,
        [FromQuery] string? sortBy,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Guid? currentUserId = null;
        if (hostedBy == "me" || joinedBy == "me")
            currentUserId = await _currentUser.GetCurrentUserIdAsync(cancellationToken).ConfigureAwait(false);

        var query = _db.Events
            .AsNoTracking()
            .Include(e => e.HostUser)
            .Include(e => e.EventGames).ThenInclude(eg => eg.BoardGame)
            .Include(e => e.Participants)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(location))
            query = query.Where(e => e.LocationAddress.Contains(location));

        if (!string.IsNullOrWhiteSpace(gameName))
            query = query.Where(e => e.EventGames.Any(eg =>
                eg.BoardGame.Name.Contains(gameName)));

        if (dateFrom.HasValue)
            query = query.Where(e => e.StartsAt >= dateFrom.Value);

        if (dateTo.HasValue)
            query = query.Where(e => e.StartsAt <= dateTo.Value);

        if (minPlayers.HasValue)
            query = query.Where(e => e.MinPlayers >= minPlayers.Value);

        if (maxPlayers.HasValue)
            query = query.Where(e => e.MaxPlayers <= maxPlayers.Value);

        if (hostedBy == "me" && currentUserId.HasValue)
            query = query.Where(e => e.HostUserId == currentUserId.Value);

        if (joinedBy == "me" && currentUserId.HasValue)
            query = query.Where(e => e.Participants.Any(p => p.UserId == currentUserId.Value));

        var events = await query.ToListAsync(cancellationToken).ConfigureAwait(false);

        var hostIds = events.Select(e => e.HostUserId).Distinct().ToList();
        var hostRatings = await _db.Reviews
            .AsNoTracking()
            .Where(r => hostIds.Contains(r.TargetUserId) && r.RatingType == RatingType.Host)
            .GroupBy(r => r.TargetUserId)
            .Select(g => new { TargetUserId = g.Key, Avg = g.Average(r => r.Rating), Count = g.Count() })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var ratingMap = hostRatings.ToDictionary(x => x.TargetUserId, x => (x.Avg, x.Count));

        if (hostRatingMin.HasValue)
            events = events.Where(e =>
                ratingMap.TryGetValue(e.HostUserId, out var r) && r.Avg >= hostRatingMin.Value).ToList();

        var summaries = events.Select(e =>
        {
            ratingMap.TryGetValue(e.HostUserId, out var rating);
            var playerCount = e.Participants.Count(p => p.Role == ParticipantRole.Player);
            return new EventSummaryResponse
            {
                Id = e.Id,
                Title = e.Title,
                BoardGameNames = e.EventGames.Select(eg => eg.BoardGame.Name).ToArray(),
                StartsAt = e.StartsAt,
                EndsAt = e.EndsAt,
                Location = e.LocationAddress,
                HostName = e.HostUser?.Username,
                HostRating = rating.Avg > 0 ? Math.Round(rating.Avg, 1) : null,
                ReviewCount = rating.Count,
                MinPlayers = e.MinPlayers,
                MaxPlayers = e.MaxPlayers,
                AvailableSlots = Math.Max(0, e.MaxPlayers - playerCount),
            };
        });

        summaries = sortBy switch
        {
            "hostRating" => summaries.OrderByDescending(s => s.HostRating ?? 0),
            _ => summaries.OrderBy(s => s.StartsAt),
        };

        var result = summaries.Skip((page - 1) * pageSize).Take(pageSize).ToArray();
        return Ok(result);
    }

    // GET /api/v1/events/{id}
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(EventDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EventDetailResponse>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var ev = await _db.Events
            .AsNoTracking()
            .Include(e => e.HostUser)
            .Include(e => e.EventGames).ThenInclude(eg => eg.BoardGame)
            .Include(e => e.Participants).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);

        if (ev == null) return NotFound();

        var currentUserId = await _currentUser.GetCurrentUserIdAsync(cancellationToken).ConfigureAwait(false);

        var hostReviewCount = await _db.Reviews
            .CountAsync(r => r.TargetUserId == ev.HostUserId && r.RatingType == RatingType.Host, cancellationToken)
            .ConfigureAwait(false);
        var hostRating = hostReviewCount > 0
            ? await _db.Reviews
                .Where(r => r.TargetUserId == ev.HostUserId && r.RatingType == RatingType.Host)
                .AverageAsync(r => r.Rating, cancellationToken)
                .ConfigureAwait(false)
            : 0.0;

        var playerCount = ev.Participants.Count(p => p.Role == ParticipantRole.Player);
        var isHost = currentUserId.HasValue && ev.HostUserId == currentUserId.Value;
        var isParticipant = currentUserId.HasValue &&
            ev.Participants.Any(p => p.UserId == currentUserId.Value);
        var hasPending = false;
        if (currentUserId.HasValue && !isParticipant && !isHost)
        {
            hasPending = await _db.JoinRequests
                .AnyAsync(r => r.EventId == id && r.UserId == currentUserId.Value && r.Status == JoinRequestStatus.Pending, cancellationToken)
                .ConfigureAwait(false);
        }

        var players = ev.Participants.Where(p => p.Role == ParticipantRole.Player).ToList();

        var detail = new EventDetailResponse
        {
            Id = ev.Id,
            Title = ev.Title,
            BoardGameNames = ev.EventGames.Select(eg => eg.BoardGame.Name).ToArray(),
            StartsAt = ev.StartsAt,
            EndsAt = ev.EndsAt,
            Location = ev.LocationAddress,
            HostUserId = ev.HostUserId,
            HostName = ev.HostUser?.Username,
            HostRating = hostRating > 0 ? Math.Round(hostRating, 1) : null,
            ReviewCount = hostReviewCount,
            Description = ev.Description,
            MinPlayers = ev.MinPlayers,
            MaxPlayers = ev.MaxPlayers,
            AvailableSlots = Math.Max(0, ev.MaxPlayers - playerCount),
            ParticipantNames = isParticipant || isHost
                ? players.Select(p => p.User.Username).ToArray()
                : [],
            Participants = isHost
                ? players.Select(p => new ParticipantInfo(p.UserId, p.User.Username)).ToArray()
                : [],
            IsCurrentUserParticipant = isParticipant,
            IsCurrentUserHost = isHost,
            HasCurrentUserPendingJoinRequest = hasPending,
        };

        return Ok(detail);
    }

    // POST /api/v1/events
    [HttpPost]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateEvent(
        [FromBody] CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _currentUser.GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        if (user == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest("Title is required.");
        if (request.EndsAt <= request.StartsAt)
            return BadRequest("EndsAt must be after StartsAt.");
        if (request.MinPlayers < 1 || request.MaxPlayers < request.MinPlayers)
            return BadRequest("Invalid player counts.");

        var ev = new Event
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            HostUserId = user.Id,
            LocationAddress = request.Location,
            StartsAt = DateTime.SpecifyKind(request.StartsAt, DateTimeKind.Utc),
            EndsAt = DateTime.SpecifyKind(request.EndsAt, DateTimeKind.Utc),
            MinPlayers = request.MinPlayers,
            MaxPlayers = request.MaxPlayers,
            Description = request.Description,
            Status = EventStatus.Published,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.Events.Add(ev);

        _db.EventParticipants.Add(new EventParticipant
        {
            EventId = ev.Id,
            UserId = user.Id,
            Role = ParticipantRole.Host,
            JoinedAt = DateTime.UtcNow,
        });

        foreach (var gameName in request.BoardGameNames.Where(n => !string.IsNullOrWhiteSpace(n)).Distinct())
        {
            var game = await _db.BoardGames
                .FirstOrDefaultAsync(bg => bg.Name == gameName, cancellationToken)
                .ConfigureAwait(false);
            if (game == null)
            {
                game = new BoardGame { Id = Guid.NewGuid(), Name = gameName };
                _db.BoardGames.Add(game);
            }
            _db.EventGames.Add(new EventGame { EventId = ev.Id, BoardGameId = game.Id });
        }

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return CreatedAtAction(nameof(GetById), new { id = ev.Id }, new { id = ev.Id });
    }

    // POST /api/v1/events/{id}/reviews
    [HttpPost("{id:guid}/reviews")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> SubmitReview(
        Guid id,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _currentUser.GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        if (user == null) return Unauthorized();

        var ev = await _db.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);
        if (ev == null) return NotFound();

        if (ev.EndsAt > DateTime.UtcNow)
            return BadRequest("Reviews can only be submitted after the event has ended.");

        if (request.Rating < 1 || request.Rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        if (request.Comment != null && request.Comment.Length > 2000)
            return BadRequest("Comment must be at most 2000 characters.");

        if (!Enum.TryParse<RatingType>(request.RatingType, ignoreCase: true, out var ratingType))
            return BadRequest("RatingType must be 'Host' or 'Player'.");

        if (request.TargetUserId == user.Id)
            return BadRequest("You cannot review yourself.");

        var isReviewerParticipant = await _db.EventParticipants
            .AnyAsync(p => p.EventId == id && p.UserId == user.Id, cancellationToken)
            .ConfigureAwait(false);
        if (!isReviewerParticipant)
            return BadRequest("You must be a participant of this event to submit a review.");

        var isTargetParticipant = await _db.EventParticipants
            .AnyAsync(p => p.EventId == id && p.UserId == request.TargetUserId, cancellationToken)
            .ConfigureAwait(false);
        if (!isTargetParticipant)
            return BadRequest("The review target must be a participant of this event.");

        var duplicate = await _db.Reviews
            .AnyAsync(r => r.EventId == id && r.ReviewerUserId == user.Id && r.TargetUserId == request.TargetUserId, cancellationToken)
            .ConfigureAwait(false);
        if (duplicate)
            return Conflict("You have already reviewed this person for this event.");

        var review = new Review
        {
            Id = Guid.NewGuid(),
            EventId = id,
            ReviewerUserId = user.Id,
            TargetUserId = request.TargetUserId,
            RatingType = ratingType,
            Rating = request.Rating,
            Comment = request.Comment,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return StatusCode(StatusCodes.Status201Created);
    }

    // DELETE /api/v1/events/{id}/participants/me
    [HttpDelete("{id:guid}/participants/me")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LeaveEvent(Guid id, CancellationToken cancellationToken)
    {
        var user = await _currentUser.GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        if (user == null) return Unauthorized();

        var participant = await _db.EventParticipants
            .FirstOrDefaultAsync(p => p.EventId == id && p.UserId == user.Id, cancellationToken)
            .ConfigureAwait(false);
        if (participant == null) return NotFound();
        if (participant.Role == ParticipantRole.Host)
            return BadRequest("The host cannot leave their own event.");

        _db.EventParticipants.Remove(participant);
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return NoContent();
    }

    // GET /api/v1/events/{id}/join-requests
    [HttpGet("{id:guid}/join-requests")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetJoinRequests(Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = await _currentUser.GetCurrentUserIdAsync(cancellationToken).ConfigureAwait(false);
        if (!currentUserId.HasValue) return Unauthorized();

        var ev = await _db.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);
        if (ev == null) return NotFound();
        if (ev.HostUserId != currentUserId.Value) return Forbid();

        var requests = await _db.JoinRequests
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.EventId == id && r.Status == JoinRequestStatus.Pending)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var userIds = requests.Select(r => r.UserId).Distinct().ToList();
        var playerRatings = await _db.Reviews
            .AsNoTracking()
            .Where(r => userIds.Contains(r.TargetUserId) && r.RatingType == RatingType.Player)
            .GroupBy(r => r.TargetUserId)
            .Select(g => new { TargetUserId = g.Key, Avg = g.Average(r => r.Rating), Count = g.Count() })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var ratingMap = playerRatings.ToDictionary(x => x.TargetUserId, x => (x.Avg, x.Count));

        var result = requests.Select(r =>
        {
            ratingMap.TryGetValue(r.UserId, out var rating);
            return new
            {
                id = r.Id,
                eventId = r.EventId,
                userId = r.UserId,
                username = r.User.Username,
                playerRating = rating.Avg > 0 ? Math.Round(rating.Avg, 1) : (double?)null,
                reviewCount = rating.Count,
                requestedAt = r.RequestedAt,
                status = r.Status.ToString(),
            };
        });

        return Ok(result);
    }

    // POST /api/v1/events/{id}/join-requests
    [HttpPost("{id:guid}/join-requests")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RequestToJoin(Guid id, CancellationToken cancellationToken)
    {
        var user = await _currentUser.GetCurrentUserAsync(cancellationToken).ConfigureAwait(false);
        if (user == null) return Unauthorized();

        var ev = await _db.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);
        if (ev == null) return NotFound();

        var alreadyParticipant = await _db.EventParticipants
            .AnyAsync(p => p.EventId == id && p.UserId == user.Id, cancellationToken)
            .ConfigureAwait(false);
        if (alreadyParticipant)
            return BadRequest(new { message = "You are already a participant of this event." });

        var alreadyPending = await _db.JoinRequests
            .AnyAsync(r => r.EventId == id && r.UserId == user.Id && r.Status == JoinRequestStatus.Pending, cancellationToken)
            .ConfigureAwait(false);
        if (alreadyPending)
            return BadRequest(new { message = "You already have a pending join request for this event." });

        _db.JoinRequests.Add(new JoinRequest
        {
            Id = Guid.NewGuid(),
            EventId = id,
            UserId = user.Id,
            Status = JoinRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return StatusCode(StatusCodes.Status201Created);
    }

    // POST /api/v1/events/{id}/join-requests/{requestId}/approve
    [HttpPost("{id:guid}/join-requests/{requestId:guid}/approve")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ApproveJoinRequest(Guid id, Guid requestId, CancellationToken cancellationToken)
    {
        var currentUserId = await _currentUser.GetCurrentUserIdAsync(cancellationToken).ConfigureAwait(false);
        if (!currentUserId.HasValue) return Unauthorized();

        var ev = await _db.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);
        if (ev == null) return NotFound();
        if (ev.HostUserId != currentUserId.Value) return Forbid();

        var joinRequest = await _db.JoinRequests
            .FirstOrDefaultAsync(r => r.Id == requestId && r.EventId == id, cancellationToken)
            .ConfigureAwait(false);
        if (joinRequest == null) return NotFound();

        joinRequest.Status = JoinRequestStatus.Approved;
        joinRequest.RespondedAt = DateTime.UtcNow;
        joinRequest.RespondedByUserId = currentUserId.Value;

        var alreadyParticipant = await _db.EventParticipants
            .AnyAsync(p => p.EventId == id && p.UserId == joinRequest.UserId, cancellationToken)
            .ConfigureAwait(false);
        if (!alreadyParticipant)
        {
            _db.EventParticipants.Add(new EventParticipant
            {
                EventId = id,
                UserId = joinRequest.UserId,
                Role = ParticipantRole.Player,
                JoinedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Ok();
    }

    // POST /api/v1/events/{id}/join-requests/{requestId}/reject
    [HttpPost("{id:guid}/join-requests/{requestId:guid}/reject")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RejectJoinRequest(Guid id, Guid requestId, CancellationToken cancellationToken)
    {
        var currentUserId = await _currentUser.GetCurrentUserIdAsync(cancellationToken).ConfigureAwait(false);
        if (!currentUserId.HasValue) return Unauthorized();

        var ev = await _db.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            .ConfigureAwait(false);
        if (ev == null) return NotFound();
        if (ev.HostUserId != currentUserId.Value) return Forbid();

        var joinRequest = await _db.JoinRequests
            .FirstOrDefaultAsync(r => r.Id == requestId && r.EventId == id, cancellationToken)
            .ConfigureAwait(false);
        if (joinRequest == null) return NotFound();

        joinRequest.Status = JoinRequestStatus.Rejected;
        joinRequest.RespondedAt = DateTime.UtcNow;
        joinRequest.RespondedByUserId = currentUserId.Value;

        await _db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Ok();
    }
}
