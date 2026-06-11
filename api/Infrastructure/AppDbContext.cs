using Microsoft.EntityFrameworkCore;
using WorldCup.Api.Infrastructure.Entities;

namespace WorldCup.Api.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<InvitationEntity> Invitations => Set<InvitationEntity>();
    public DbSet<MatchEntity> Matches => Set<MatchEntity>();
    public DbSet<PredictionEntity> Predictions => Set<PredictionEntity>();
    public DbSet<ScoreEntity> Scores => Set<ScoreEntity>();
    public DbSet<EventEntity> Events => Set<EventEntity>();
    public DbSet<RaffleEntity> Raffles => Set<RaffleEntity>();
    public DbSet<RaffleParticipantEntity> RaffleParticipants => Set<RaffleParticipantEntity>();
    public DbSet<RaffleWinnerEntity> RaffleWinners => Set<RaffleWinnerEntity>();
    public DbSet<PaymentEntity> Payments => Set<PaymentEntity>();
    public DbSet<ChampionPredictionEntity> ChampionPredictions => Set<ChampionPredictionEntity>();
    public DbSet<PasswordResetTokenEntity> PasswordResetTokens => Set<PasswordResetTokenEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // UserEntity
        modelBuilder.Entity<UserEntity>(e => {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(256).IsRequired();
            e.Property(u => u.DisplayName).HasMaxLength(100).IsRequired();
            e.Property(u => u.Role).HasMaxLength(20);
            e.Property(u => u.Status).HasMaxLength(20);
            e.Property(u => u.Gender).HasMaxLength(20);
        });

        // InvitationEntity
        modelBuilder.Entity<InvitationEntity>(e => {
            e.HasKey(i => i.Id);
            e.HasIndex(i => i.Token).IsUnique();
            e.Property(i => i.Email).HasMaxLength(256).IsRequired();
            e.Property(i => i.Token).HasMaxLength(512).IsRequired();
            e.Property(i => i.Status).HasMaxLength(20);
        });

        // MatchEntity
        modelBuilder.Entity<MatchEntity>(e => {
            e.HasKey(m => m.Id);
            e.Property(m => m.HomeTeam).HasMaxLength(100).IsRequired();
            e.Property(m => m.AwayTeam).HasMaxLength(100).IsRequired();
        });

        // PredictionEntity
        modelBuilder.Entity<PredictionEntity>(e => {
            e.HasKey(p => p.Id);
            e.HasIndex(p => new { p.UserId, p.MatchId }).IsUnique();
            e.HasOne(p => p.User).WithMany(u => u.Predictions).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Match).WithMany(m => m.Predictions).HasForeignKey(p => p.MatchId).OnDelete(DeleteBehavior.Cascade);
        });

        // ScoreEntity
        modelBuilder.Entity<ScoreEntity>(e => {
            e.HasKey(s => s.Id);
            e.HasIndex(s => s.UserId).IsUnique();
            e.HasOne(s => s.User).WithMany(u => u.Scores).HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // EventEntity
        modelBuilder.Entity<EventEntity>(e => {
            e.HasKey(ev => ev.Id);
            e.Property(ev => ev.Title).HasMaxLength(200).IsRequired();
            e.Property(ev => ev.Type).HasMaxLength(30);
        });

        // RaffleEntity
        modelBuilder.Entity<RaffleEntity>(e => {
            e.HasKey(r => r.Id);
            e.Property(r => r.Title).HasMaxLength(200).IsRequired();
            e.Property(r => r.ParticipationMode).HasMaxLength(20);
        });

        // RaffleParticipantEntity (junction, composite PK)
        modelBuilder.Entity<RaffleParticipantEntity>(e => {
            e.HasKey(rp => new { rp.RaffleId, rp.UserId });
            e.HasOne(rp => rp.Raffle).WithMany(r => r.Participants).HasForeignKey(rp => rp.RaffleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(rp => rp.User).WithMany(u => u.RaffleParticipations).HasForeignKey(rp => rp.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        // RaffleWinnerEntity (junction, composite PK)
        modelBuilder.Entity<RaffleWinnerEntity>(e => {
            e.HasKey(rw => new { rw.RaffleId, rw.UserId });
            e.HasOne(rw => rw.Raffle).WithMany(r => r.Winners).HasForeignKey(rw => rw.RaffleId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(rw => rw.User).WithMany(u => u.RaffleWins).HasForeignKey(rw => rw.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        // ChampionPredictionEntity
        modelBuilder.Entity<ChampionPredictionEntity>(e => {
            e.HasKey(cp => cp.Id);
            e.HasIndex(cp => cp.UserId).IsUnique();
            e.Property(cp => cp.Team).HasMaxLength(100).IsRequired();
            e.Property(cp => cp.Flag).HasMaxLength(20).IsRequired();
            e.HasOne(cp => cp.User).WithMany().HasForeignKey(cp => cp.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // PasswordResetTokenEntity
        modelBuilder.Entity<PasswordResetTokenEntity>(e => {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.Token).IsUnique();
            e.Property(t => t.Token).HasMaxLength(256).IsRequired();
            e.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // PaymentEntity
        modelBuilder.Entity<PaymentEntity>(e => {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.WompiTransactionId).IsUnique();
            e.HasIndex(p => p.UserId);
            e.HasIndex(p => new { p.Status, p.CreatedAtUtc });
            e.HasIndex(p => p.WompiReference);
            e.Property(p => p.WompiTransactionId).HasMaxLength(128);
            e.Property(p => p.WompiReference).HasMaxLength(128);
            e.Property(p => p.Status).HasMaxLength(20);
            e.Property(p => p.Currency).HasMaxLength(3);
            e.Property(p => p.PaymentMethodType).HasMaxLength(50);
            e.Property(p => p.Environment).HasMaxLength(20);
            e.Property(p => p.CardBrand).HasMaxLength(20);
            e.Property(p => p.CardLastFour).HasMaxLength(4);
            e.HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
