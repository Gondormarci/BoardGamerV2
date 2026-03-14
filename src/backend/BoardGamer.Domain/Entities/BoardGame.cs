namespace BoardGamer.Domain.Entities;

public class BoardGame
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<EventGame> EventGames { get; set; } = new List<EventGame>();
}
