# World Cup 2026 Predictor

A prediction platform for the 2026 FIFA World Cup, built with React + TypeScript frontend and .NET 8 Azure Functions backend.

## Project Status

**Current Phase**: Backend MVP Setup ✅
- ✅ Azure Functions project initialized (.NET 8 isolated worker)
- ✅ Core domain models created (Match, Prediction, UserProfile, Score)
- ✅ Cosmos DB integration configured
- ✅ CORS setup for frontend communication
- ✅ Repository pattern implementation
- ✅ **Swagger/OpenAPI documentation** 🎉
- ⏳ Frontend React application

## Architecture

### Backend (`api/`)
- **.NET 8** with Azure Functions v4 (isolated worker model)
- **Cosmos DB** for data persistence
- **Repository pattern** for data access abstraction
- **Swagger/OpenAPI** for API documentation and testing

#### API Endpoints
- `GET /api/matches` - Get upcoming matches
- `POST /api/predictions` - Create/update prediction
- `GET /api/football/fixtures` - Get fixtures from API-Football
- `GET /api/football/fixtures/live` - Get live fixtures
- `GET /api/football/fixtures/date/{date}` - Get fixtures by date
- `GET /api/football/standings` - Get league standings
- `GET /api/football/leagues` - Get available leagues

📖 **Full documentation available at**: http://localhost:7071/api/swagger/ui (when running)

#### Domain Models
- **Match**: Tournament matches with teams, kickoff time, stage, and scores
- **Prediction**: User predictions with points calculation
- **UserProfile**: User information and statistics
- **Score**: Leaderboard rankings with detailed metrics

### Frontend (`app/`) - Planned
- React 18 + TypeScript + Vite
- React Router v6 for navigation
- Azure Static Web Apps for hosting

## Getting Started

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Azure Functions Core Tools](https://docs.microsoft.com/azure/azure-functions/functions-run-local)
- [Azure Cosmos DB Emulator](https://aka.ms/cosmosdb-emulator) (for local development)
- [Node.js 18+](https://nodejs.org/) (for frontend, when implemented)

### Quick Start

1. **Install Cosmos DB Emulator**:
   - Download from: https://aka.ms/cosmosdb-emulator
   - Install and start the emulator
   - Verify it's running at: https://localhost:8081/_explorer/index.html

2. **Run the application with Swagger**:
   ```powershell
   # Option 1: Using the Swagger startup script (recommended)
   .\start-swagger.ps1

   # Option 2: Using the full startup script
   .\start.ps1

   # Option 3: Manual startup
   cd api
   func start
   ```

3. **Access Swagger UI** 📖:
   - **Swagger UI**: http://localhost:7071/api/swagger/ui
   - **OpenAPI JSON**: http://localhost:7071/api/openapi/v3.json
   - **OpenAPI YAML**: http://localhost:7071/api/openapi/v3.yaml

4. **Test the API** (using Swagger or curl):
   ```powershell
   # Get matches
   curl http://localhost:7071/api/matches

   # Create a prediction
   curl -X POST http://localhost:7071/api/predictions `
     -H "Content-Type: application/json" `
     -H "X-MS-CLIENT-PRINCIPAL-ID: user123" `
     -d '{"matchId":"match-1","home":2,"away":1}'
   ```

> 💡 **Tip**: Use Swagger UI to explore and test all endpoints interactively. See [SWAGGER_SETUP.md](./SWAGGER_SETUP.md) for detailed documentation.
   .\start.ps1

   # Option 2: Manual startup
   cd api
   func start
   ```

3. **Test the API**:
   ```powershell
   # Get matches
   curl http://localhost:7071/api/matches

   # Create a prediction
   curl -X POST http://localhost:7071/api/predictions `
     -H "Content-Type: application/json" `
     -H "X-MS-CLIENT-PRINCIPAL-ID: user123" `
     -d '{"matchId":"match-1","home":2,"away":1}'
   ```

### Detailed Setup

For detailed Cosmos DB configuration (emulator vs Azure), see [COSMOS_SETUP.md](./COSMOS_SETUP.md)

**The application automatically**:
- ✅ Creates the database `worldcup-db` if it doesn't exist
- ✅ Creates containers: `matches`, `predictions`, `scores`
- ✅ Initializes with proper partition keys
- ✅ Shows initialization status on startup
   ```powershell
   cd api
   func start
   ```
   The API will be available at `http://localhost:7071`

3. **Build the project**:
   ```powershell
   cd api
   dotnet build
   ```

## Project Structure

```
WorldCup2026/
├── api/                          # .NET 8 Azure Functions backend
│   ├── Functions/                # HTTP-triggered functions
│   │   ├── MatchesFunction.cs    # Match endpoints
│   │   ├── PredictionsFunction.cs # Prediction endpoints
│   │   └── ApiFootballFunction.cs # API-Football integration
│   ├── Models/                   # Domain models
│   │   ├── Match.cs              # Match entity
│   │   ├── Prediction.cs         # User prediction
│   │   ├── UserProfile.cs        # User profile
│   │   └── Score.cs              # Leaderboard score
│   ├── Infrastructure/           # Data access layer
│   │   ├── Repositories/         # Repository pattern
│   │   ├── CosmosContext.cs      # Cosmos client
│   │   └── CosmosDbInitializer.cs
│   ├── Services/                 # Business logic
│   │   ├── ScoringService.cs     # Points calculation
│   │   ├── TimeProviderService.cs
│   │   └── ApiFootballService.cs
│   ├── Program.cs                # DI configuration & startup
│   ├── local.settings.json       # Local configuration (gitignored)
│   └── api.csproj                # Project file
├── .github/
│   └── copilot-instructions.md   # AI agent guidelines
├── start-swagger.ps1             # Quick start with Swagger
├── start-swagger.bat             # Quick start (Windows)
├── SWAGGER_SETUP.md              # Swagger documentation
└── README.md
```

## Next Steps

1. ~~**Repository Layer**: Implement repository pattern for Cosmos DB operations~~ ✅
2. ~~**Azure Functions**: Create HTTP endpoints for matches, predictions, and rankings~~ ✅
3. ~~**Swagger/OpenAPI**: Document all API endpoints~~ ✅
4. **Scoring Service**: Implement points calculation logic
5. **Frontend**: Bootstrap React application with Vite
6. **Authentication**: Integrate Azure Static Web Apps authentication
7. **Deployment**: Set up GitHub Actions for CI/CD to Azure

## Documentation

- **[SWAGGER_SETUP.md](./SWAGGER_SETUP.md)** - Swagger/OpenAPI setup and usage guide
- **[COSMOS_SETUP.md](./COSMOS_SETUP.md)** - Cosmos DB configuration guide
- **[API_FOOTBALL_GUIDE.md](./API_FOOTBALL_GUIDE.md)** - API-Football integration guide
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - Development guidelines

## Development Guidelines

See `.github/copilot-instructions.md` for detailed architectural patterns and conventions.

### Key Conventions
- **Repository Pattern**: Never access Cosmos directly in Functions
- **Nullable References**: Enabled in project - handle nulls explicitly
- **Time Provider**: Use injected `TimeProviderService` instead of `DateTime.Now`
- **Secrets**: Never commit `local.settings.json` with real credentials

## License

MIT
