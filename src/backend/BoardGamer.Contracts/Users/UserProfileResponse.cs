namespace BoardGamer.Contracts.Users;

public class UserProfileResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public double HostRating { get; set; }
    public int HostReviewCount { get; set; }
    public double PlayerRating { get; set; }
    public int PlayerReviewCount { get; set; }
    public int EventsHostedCount { get; set; }
    public int EventsAttendedCount { get; set; }
}
