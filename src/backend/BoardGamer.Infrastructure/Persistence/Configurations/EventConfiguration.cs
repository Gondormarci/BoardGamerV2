using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.ToTable("Events");
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.StartsAt);
        builder.HasIndex(e => e.HostUserId);
        builder.Property(e => e.Title).HasMaxLength(500).IsRequired();
        builder.Property(e => e.LocationAddress).HasMaxLength(500).IsRequired();
        builder.Property(e => e.Description).HasMaxLength(4000);
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(32);
        builder.HasOne(e => e.HostUser)
            .WithMany(u => u.HostedEvents)
            .HasForeignKey(e => e.HostUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
