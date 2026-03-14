using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class CookieConsentConfiguration : IEntityTypeConfiguration<CookieConsent>
{
    public void Configure(EntityTypeBuilder<CookieConsent> builder)
    {
        builder.ToTable("CookieConsents");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.ConsentType).HasMaxLength(64).IsRequired();
        builder.HasOne(e => e.User)
            .WithMany(u => u.CookieConsents)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
