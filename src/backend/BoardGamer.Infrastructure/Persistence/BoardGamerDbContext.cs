using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BoardGamer.Infrastructure.Persistence;

public class BoardGamerDbContext : DbContext
{
    public BoardGamerDbContext(DbContextOptions<BoardGamerDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<BoardGame> BoardGames => Set<BoardGame>();
    public DbSet<EventGame> EventGames => Set<EventGame>();
    public DbSet<JoinRequest> JoinRequests => Set<JoinRequest>();
    public DbSet<EventParticipant> EventParticipants => Set<EventParticipant>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<CookieConsent> CookieConsents => Set<CookieConsent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(BoardGamerDbContext).Assembly);
    }
}
