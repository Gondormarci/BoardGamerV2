namespace BoardGamer.Domain.Entities;

public class JoinRequest
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public JoinRequestStatus Status { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? RespondedAt { get; set; }
    public Guid? RespondedByUserId { get; set; }

    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
