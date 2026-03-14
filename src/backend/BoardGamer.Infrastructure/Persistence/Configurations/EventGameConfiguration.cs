using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class EventGameConfiguration : IEntityTypeConfiguration<EventGame>
{
    public void Configure(EntityTypeBuilder<EventGame> builder)
    {
        builder.ToTable("EventGames");
        builder.HasKey(e => new { e.EventId, e.BoardGameId });
        builder.HasOne(e => e.Event)
            .WithMany(ev => ev.EventGames)
            .HasForeignKey(e => e.EventId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.BoardGame)
            .WithMany(b => b.EventGames)
            .HasForeignKey(e => e.BoardGameId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
