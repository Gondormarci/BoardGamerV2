namespace BoardGamer.Domain.Entities;

public class Review
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid ReviewerUserId { get; set; }
    public Guid TargetUserId { get; set; }
    public RatingType RatingType { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    public Event Event { get; set; } = null!;
    public User ReviewerUser { get; set; } = null!;
    public User TargetUser { get; set; } = null!;
}
