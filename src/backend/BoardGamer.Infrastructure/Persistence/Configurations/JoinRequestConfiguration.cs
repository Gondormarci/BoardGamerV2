using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class JoinRequestConfiguration : IEntityTypeConfiguration<JoinRequest>
{
    public void Configure(EntityTypeBuilder<JoinRequest> builder)
    {
        builder.ToTable("JoinRequests");
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => new { e.EventId, e.Status });
        builder.Property(e => e.Status).HasConversion<string>().HasMaxLength(32);
        builder.HasOne(e => e.Event)
            .WithMany(ev => ev.JoinRequests)
            .HasForeignKey(e => e.EventId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.User)
            .WithMany(u => u.JoinRequests)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
