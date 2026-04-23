namespace BoardGamer.Contracts.Events;

public record CreateEventRequest
{
    public string Title { get; init; } = "";
    public string Location { get; init; } = "";
    public DateTime StartsAt { get; init; }
    public DateTime EndsAt { get; init; }
    public int MinPlayers { get; init; }
    public int MaxPlayers { get; init; }
    public string Description { get; init; } = "";
    public string[] BoardGameNames { get; init; } = [];
}
