namespace BoardGamer.Contracts.Events;

public record ParticipantInfo(Guid UserId, string Username);

public record EventDetailResponse : EventSummaryResponse
{
    public Guid HostUserId { get; init; }
    public string? Description { get; init; }
    public string[] ParticipantNames { get; init; } = [];
    public ParticipantInfo[] Participants { get; init; } = [];
    public bool IsCurrentUserParticipant { get; init; }
    public bool IsCurrentUserHost { get; init; }
    public bool HasCurrentUserPendingJoinRequest { get; init; }
}
