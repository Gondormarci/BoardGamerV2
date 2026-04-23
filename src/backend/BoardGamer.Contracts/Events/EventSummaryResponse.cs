namespace BoardGamer.Contracts.Events;

public record EventSummaryResponse
{
    public Guid Id { get; init; }
    public string Title { get; init; } = "";
    public string[] BoardGameNames { get; init; } = [];
    public DateTime StartsAt { get; init; }
    public DateTime EndsAt { get; init; }
    public string? Location { get; init; }
    public string? HostName { get; init; }
    public double? HostRating { get; init; }
    public int ReviewCount { get; init; }
    public int MinPlayers { get; init; }
    public int MaxPlayers { get; init; }
    public int AvailableSlots { get; init; }
}
