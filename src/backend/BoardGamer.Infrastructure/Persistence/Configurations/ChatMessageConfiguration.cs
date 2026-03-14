using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Content).HasMaxLength(4000).IsRequired();
        builder.HasOne(e => e.Event)
            .WithMany(ev => ev.ChatMessages)
            .HasForeignKey(e => e.EventId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(e => e.User)
            .WithMany(u => u.ChatMessages)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
