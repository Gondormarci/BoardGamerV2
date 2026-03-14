namespace BoardGamer.Domain.Entities;

public class CookieConsent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string ConsentType { get; set; } = string.Empty;
    public bool Accepted { get; set; }
    public DateTime RecordedAt { get; set; }

    public User User { get; set; } = null!;
}
