using System.Globalization;
using BoardGamer.Application.Common;
using BoardGamer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace BoardGamer.Api.Hubs;

/// <summary>
/// SignalR hub for event-scoped chat. Clients join group "event_{eventId}" after participant check.
/// </summary>
[Authorize]
public class EventChatHub : Hub
{
    private const string EventIdKey = "EventId";
    private readonly BoardGamerDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<EventChatHub> _logger;

    public EventChatHub(
        BoardGamerDbContext db,
        ICurrentUserService currentUser,
        ILogger<EventChatHub> logger)
    {
        _db = db;
        _currentUser = currentUser;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var eventIdStr = Context.GetHttpContext()?.Request.Query["eventId"].FirstOrDefault();
        if (string.IsNullOrEmpty(eventIdStr) || !Guid.TryParse(eventIdStr, out var eventId))
        {
            _logger.LogWarning("EventChatHub connection rejected: missing or invalid eventId");
            Context.Abort();
            return;
        }

        var userId = await _currentUser.GetCurrentUserIdAsync(Context.ConnectionAborted).ConfigureAwait(false);
        if (userId == null)
        {
            _logger.LogWarning("EventChatHub connection rejected: unauthenticated");
            Context.Abort();
            return;
        }

        var isParticipant = await _db.EventParticipants
            .AsNoTracking()
            .AnyAsync(ep => ep.EventId == eventId && ep.UserId == userId.Value, Context.ConnectionAborted)
            .ConfigureAwait(false);
        if (!isParticipant)
        {
            _logger.LogInformation(
                "EventChatHub connection rejected: user {UserId} is not participant of event {EventId}",
                userId.Value, eventId);
            Context.Abort();
            return;
        }

        Context.Items[EventIdKey] = eventId;
        var groupName = GetGroupName(eventId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName, Context.ConnectionAborted).ConfigureAwait(false);
        _logger.LogInformation(
            "EventChatHub: user {UserId} joined group {GroupName}",
            userId.Value, groupName);
        await base.OnConnectedAsync().ConfigureAwait(false);
    }

    public async Task SendMessage(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return;

        if (!Context.Items.TryGetValue(EventIdKey, out var eventIdObj) || eventIdObj is not Guid eventId)
        {
            _logger.LogWarning("EventChatHub SendMessage: connection has no EventId");
            return;
        }

        var userId = await _currentUser.GetCurrentUserIdAsync(Context.ConnectionAborted).ConfigureAwait(false);
        if (userId == null)
            return;

        var user = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new { u.Username })
            .FirstOrDefaultAsync(Context.ConnectionAborted)
            .ConfigureAwait(false);
        var senderName = user?.Username ?? userId.Value.ToString();

        var createdUtc = DateTime.UtcNow;
        var payload = new
        {
            SenderId = userId.Value.ToString(),
            SenderName = senderName,
            Content = content.Trim(),
            CreatedAt = createdUtc.ToString("O", CultureInfo.InvariantCulture)
        };

        var groupName = GetGroupName(eventId);
        await Clients.Group(groupName).SendAsync("ReceiveMessage", payload, Context.ConnectionAborted).ConfigureAwait(false);

        var chatMessage = new BoardGamer.Domain.Entities.ChatMessage
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            UserId = userId.Value,
            Content = content.Trim(),
            CreatedAt = createdUtc
        };
        _db.ChatMessages.Add(chatMessage);
        try
        {
            await _db.SaveChangesAsync(Context.ConnectionAborted).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EventChatHub: failed to persist chat message for event {EventId}", eventId);
        }
    }

    private static string GetGroupName(Guid eventId) => "event_" + eventId.ToString("N");

}
