namespace BoardGamer.Domain.Entities;

public class EventParticipant
{
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public ParticipantRole Role { get; set; }
    public DateTime JoinedAt { get; set; }

    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
