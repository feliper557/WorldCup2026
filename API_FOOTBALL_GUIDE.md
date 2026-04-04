# API-Football Integration Guide

## Overview
API-Football (API-Sports) provides comprehensive football data with a generous free tier (100 requests/day). This replaces the limited BeSoccer API for critical features like standings and match data.

## Configuration

### API Key Setup
1. Get your API key from [API-Sports](https://www.api-football.com/)
2. Update `api/local.settings.json`:
```json
{
  "Values": {
    "ApiFootballKey": "YOUR_ACTUAL_API_KEY_HERE",
    "ApiFootballHost": "v3.football.api-sports.io"
  }
}
```

## Available Endpoints

### 1. Get Fixtures (Matches)
**Endpoint**: `GET /api/football/fixtures`

**Query Parameters** (all optional):
- `date` - Specific date (YYYY-MM-DD)
- `league` - League ID
- `team` - Team ID
- `live` - Get live matches (use "all" for all live matches)
- `season` - Season year (e.g., 2026)

**Examples**:
```powershell
# Get matches for specific date and league
Invoke-RestMethod "http://localhost:7071/api/football/fixtures?date=2026-06-11&league=1"

# Get all matches for a team
Invoke-RestMethod "http://localhost:7071/api/football/fixtures?team=33&season=2026"

# Get live matches
Invoke-RestMethod "http://localhost:7071/api/football/fixtures?live=all"
```

### 2. Get Live Fixtures
**Endpoint**: `GET /api/football/fixtures/live`

Returns all currently live matches.

**Example**:
```powershell
Invoke-RestMethod "http://localhost:7071/api/football/fixtures/live"
```

### 3. Get Fixtures by Date
**Endpoint**: `GET /api/football/fixtures/date/{date}`

**Path Parameter**:
- `date` - Date in format YYYY-MM-DD

**Query Parameters** (optional):
- `league` - Filter by league ID

**Example**:
```powershell
# Get all matches on 2026-06-11
Invoke-RestMethod "http://localhost:7071/api/football/fixtures/date/2026-06-11"

# Get matches for specific league on that date
Invoke-RestMethod "http://localhost:7071/api/football/fixtures/date/2026-06-11?league=1"
```

### 4. Get Standings
**Endpoint**: `GET /api/football/standings`

**Query Parameters** (required):
- `league` - League ID
- `season` - Season year (e.g., 2026)

**Example**:
```powershell
# Get standings for World Cup 2026
Invoke-RestMethod "http://localhost:7071/api/football/standings?league=1&season=2026"
```

### 5. Get Leagues
**Endpoint**: `GET /api/football/leagues`

**Query Parameters** (all optional):
- `country` - Country name
- `season` - Season year
- `id` - Specific league ID

**Examples**:
```powershell
# Get all leagues for a country
Invoke-RestMethod "http://localhost:7071/api/football/leagues?country=Spain&season=2024"

# Get specific league details
Invoke-RestMethod "http://localhost:7071/api/football/leagues?id=140"
```

## Response Format

All endpoints return data in this structure:
```json
{
  "get": "string",          // Endpoint called
  "parameters": {},         // Parameters used
  "errors": {},             // Error messages if any
  "results": 0,             // Number of results
  "paging": {
    "current": 1,
    "total": 1
  },
  "response": []            // Actual data array
}
```

## Fixture (Match) Data Structure

```json
{
  "fixture": {
    "id": 1234,
    "referee": "Name",
    "timezone": "UTC",
    "date": "2026-06-11T20:00:00+00:00",
    "timestamp": 1778799600,
    "venue": {
      "id": 100,
      "name": "Stadium Name",
      "city": "City"
    },
    "status": {
      "long": "Match Finished",
      "short": "FT",
      "elapsed": 90
    }
  },
  "league": {
    "id": 1,
    "name": "World Cup",
    "country": "World",
    "season": 2026,
    "round": "Group Stage - 1"
  },
  "teams": {
    "home": {
      "id": 26,
      "name": "USA",
      "logo": "https://...",
      "winner": true
    },
    "away": {
      "id": 21,
      "name": "Mexico",
      "logo": "https://...",
      "winner": false
    }
  },
  "goals": {
    "home": 2,
    "away": 1
  },
  "score": {
    "halftime": { "home": 1, "away": 0 },
    "fulltime": { "home": 2, "away": 1 },
    "extratime": { "home": null, "away": null },
    "penalty": { "home": null, "away": null }
  }
}
```

## Standing Data Structure

```json
{
  "league": {
    "id": 1,
    "name": "World Cup",
    "country": "World",
    "season": 2026,
    "standings": [
      [
        {
          "rank": 1,
          "team": {
            "id": 26,
            "name": "USA",
            "logo": "https://..."
          },
          "points": 7,
          "goalsDiff": 5,
          "group": "Group A",
          "form": "WWD",
          "status": "same",
          "description": "Promotion - Round of 16",
          "all": {
            "played": 3,
            "win": 2,
            "draw": 1,
            "lose": 0,
            "goals": { "for": 7, "against": 2 }
          },
          "home": {...},
          "away": {...}
        }
      ]
    ]
  }
}
```

## Common League IDs

- **World Cup**: `1`
- **UEFA Champions League**: `2`
- **UEFA Europa League**: `3`
- **Premier League**: `39`
- **La Liga**: `140`
- **Bundesliga**: `78`
- **Serie A**: `135`
- **Ligue 1**: `61`

## Rate Limits

**Free Tier**: 100 requests per day
- All endpoints available
- Live scores updated every 15 seconds
- Historical data available

**Recommendations**:
- Cache responses when possible
- Use specific filters (league, team) to reduce data size
- Schedule updates strategically to stay within limits

## Error Handling

The service includes comprehensive error handling:
- HTTP errors are caught and logged
- JSON parsing errors are handled
- API errors are extracted from response and thrown as exceptions
- All errors are logged with context

## Testing

Before testing, make sure:
1. Backend is running: `cd api; func start`
2. API key is configured in `local.settings.json`

Test endpoints:
```powershell
# Test leagues
$leagues = Invoke-RestMethod "http://localhost:7071/api/football/leagues?country=World&season=2026"
$leagues.response | Format-Table

# Test fixtures
$fixtures = Invoke-RestMethod "http://localhost:7071/api/football/fixtures?date=2024-12-01&league=39"
$fixtures.response | Format-Table

# Test standings
$standings = Invoke-RestMethod "http://localhost:7071/api/football/standings?league=39&season=2024"
$standings.response[0].league.standings
```

## Migration from BeSoccer

Key differences:
- **Standings**: Now fully available (was blocked in BeSoccer)
- **Fixtures**: More detailed match data with venue, referee, periods
- **Live Updates**: Every 15 seconds vs. unknown for BeSoccer
- **Data Quality**: Professional-grade with extensive coverage
- **Rate Limits**: Clear 100/day limit vs. unclear BeSoccer restrictions

## Next Steps

1. Replace API key placeholder with your actual key
2. Test all endpoints with your key
3. Consider migrating remaining BeSoccer calls to API-Football
4. Implement caching strategy for rate limit management
5. Add frontend integration for fixtures and standings
