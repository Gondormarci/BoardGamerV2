using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.RatingType).HasConversion<string>().HasMaxLength(32);
        builder.Property(e => e.Comment).HasMaxLength(2000);
        builder.HasOne(e => e.Event)
            .WithMany(ev => ev.Reviews)
            .HasForeignKey(e => e.EventId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.ReviewerUser)
            .WithMany(u => u.ReviewsGiven)
            .HasForeignKey(e => e.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(e => e.TargetUser)
            .WithMany(u => u.ReviewsReceived)
            .HasForeignKey(e => e.TargetUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
