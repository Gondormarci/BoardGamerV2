using BoardGamer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BoardGamer.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(e => e.Id);
        builder.HasIndex(e => e.KeycloakSubjectId).IsUnique();
        builder.Property(e => e.Username).HasMaxLength(256).IsRequired();
        builder.Property(e => e.KeycloakSubjectId).HasMaxLength(256).IsRequired();
        builder.Property(e => e.Bio).HasMaxLength(2000);
    }
}
