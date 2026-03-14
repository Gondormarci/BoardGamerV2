namespace BoardGamer.Domain.Entities;

public class Event
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid HostUserId { get; set; }
    public string LocationAddress { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public string Description { get; set; } = string.Empty;
    public EventStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User HostUser { get; set; } = null!;
    public ICollection<EventGame> EventGames { get; set; } = new List<EventGame>();
    public ICollection<JoinRequest> JoinRequests { get; set; } = new List<JoinRequest>();
    public ICollection<EventParticipant> Participants { get; set; } = new List<EventParticipant>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
