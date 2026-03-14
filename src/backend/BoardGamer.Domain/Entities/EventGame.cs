namespace BoardGamer.Domain.Entities;

public class EventGame
{
    public Guid EventId { get; set; }
    public Guid BoardGameId { get; set; }

    public Event Event { get; set; } = null!;
    public BoardGame BoardGame { get; set; } = null!;
}
