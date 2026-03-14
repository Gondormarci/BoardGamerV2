namespace BoardGamer.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public Event Event { get; set; } = null!;
    public User User { get; set; } = null!;
}
