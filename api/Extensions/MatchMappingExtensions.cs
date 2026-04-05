using WorldCup.Api.Infrastructure.Entities;
using WorldCup.Api.Models;

namespace WorldCup.Api.Extensions;

public static class MatchMappingExtensions
{
    public static MatchEntity ToEntity(this Match match)
    {
        return new MatchEntity
        {
            Id = match.Id,
            HomeTeam = match.HomeTeam,
            AwayTeam = match.AwayTeam,
            Stage = match.Stage,
            Group = match.Group,
            MatchDate = match.MatchDate,
            Status = match.Status,
            HomeScore = match.HomeScore,
            AwayScore = match.AwayScore,
            Venue = match.Venue,
            ExternalId = match.ExternalId,
            TournamentId = match.TournamentId?.ToString(),
            CreatedAt = match.CreatedAt
        };
    }

    public static Match ToModel(this MatchEntity entity)
    {
        return new Match
        {
            Id = entity.Id,
            HomeTeam = entity.HomeTeam,
            AwayTeam = entity.AwayTeam,
            Stage = entity.Stage,
            Group = entity.Group,
            MatchDate = entity.MatchDate,
            Status = entity.Status,
            HomeScore = entity.HomeScore,
            AwayScore = entity.AwayScore,
            Venue = entity.Venue,
            ExternalId = entity.ExternalId,
            TournamentId = entity.TournamentId != null ? int.Parse(entity.TournamentId) : null,
            CreatedAt = entity.CreatedAt
        };
    }
}
