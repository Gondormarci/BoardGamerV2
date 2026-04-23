namespace BoardGamer.Contracts.Events;

public record CreateReviewRequest
{
    public Guid TargetUserId { get; init; }
    public string RatingType { get; init; } = "";
    public int Rating { get; init; }
    public string? Comment { get; init; }
}
