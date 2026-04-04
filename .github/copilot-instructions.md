# World Cup 2026 Predictor - AI Agent Instructions

## Current State
**This is a new project repository.** The codebase is currently empty except for this instructions file. The architecture below represents the planned implementation for a World Cup 2026 prediction platform.

## Planned Architecture

### Monorepo Structure
```
WorldCup2026/
├── app/          # React + TypeScript + Vite frontend
├── api/          # .NET 8 Azure Functions backend
└── .github/      # GitHub Actions workflows
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, React Router v6, Azure Static Web Apps
- **Backend**: .NET 8, Azure Functions v4 (isolated worker), Cosmos DB
- **Auth**: Azure Static Web Apps built-in authentication
- **Deployment**: Azure Static Web Apps (both frontend and functions)

## Project Setup (When Implementing)

### Initial Setup Commands
```powershell
# Frontend setup
npm create vite@latest app -- --template react-ts
cd app; npm install react-router-dom; cd ..

# Backend setup
mkdir api; cd api
func init --worker-runtime dotnet-isolated --target-framework net8.0
dotnet add package Microsoft.Azure.Cosmos
dotnet add package Microsoft.Azure.Functions.Worker.Extensions.Http
cd ..
```

## Architectural Patterns (Planned)

### Frontend (`app/`)
**Entry Flow**: `main.tsx` → `App.tsx` → `router.tsx`

**Directory Structure**:
```
src/
├── pages/              # Page components (LoginPage, DashboardPage, etc.)
├── components/         # Feature-specific components
│   ├── matches/        # Match prediction UI
│   ├── ranking/        # Leaderboard components
│   └── Layout/         # Shared layout components
├── services/
│   ├── apiClient.ts    # Centralized API calls (never use raw fetch)
│   └── auth.ts         # Azure SWA auth integration
├── hooks/              # React hooks (useAuthUser, etc.)
└── types/              # Shared TypeScript types
    ├── match.ts
    ├── prediction.ts
    └── ranking.ts
```

**Key Conventions**:
- All API calls through `apiClient.ts` — never use `fetch()` directly
- Use TypeScript interfaces from `types/` for all props and data
- React Router v6 routes defined centrally in `router.tsx`

### Backend (`api/`)
**Entry Point**: `Program.cs` configures DI, Cosmos connection, and CORS

**Directory Structure**:
```
api/
├── Program.cs                    # Startup configuration
├── Functions/                    # HTTP-triggered Azure Functions
│   ├── MatchesFunction.cs
│   ├── PredictionsFunction.cs
│   └── RankingFunction.cs
├── Services/
│   ├── ScoringService.cs         # Prediction scoring logic
│   └── TimeProviderService.cs    # Testable time abstraction
├── Infrastructure/
│   └── Repositories/             # Repository pattern for Cosmos
│       ├── Interfaces/
│       └── Implementations/
└── Models/                       # Domain models
    ├── Match.cs
    ├── Prediction.cs
    ├── Score.cs
    └── UserProfile.cs
```

**Critical Patterns**:
- **Repository Pattern**: Never access Cosmos directly in Functions — inject `I*Repository` interfaces
- **Time Provider**: Inject `TimeProviderService` instead of `DateTime.Now` for testability
- **Nullable References**: Enable `<Nullable>enable</Nullable>` — handle nulls explicitly
- **HTTP Triggers**: Use `[Function("FunctionName")]` attribute and `HttpTrigger` binding
- **Configuration**: `CosmosOptions` binds to app settings; `local.settings.json` for local dev (gitignored)

## Development Workflow

### Local Development
```powershell
# Terminal 1: Frontend dev server
cd app
npm install
npm run dev              # http://localhost:5173

# Terminal 2: Backend functions
cd api
dotnet restore
func start               # http://localhost:7071
```

**Local Integration**: Configure `apiClient.ts` to point to `http://localhost:7071/api` in dev mode

### Testing
```powershell
# Frontend
cd app; npm run build; npm run preview

# Backend
cd api; dotnet build; dotnet test
```

## Integration & Data Flow

### Authentication Flow
1. Frontend uses Azure Static Web Apps auth (`/.auth/login/*` routes)
2. Backend validates `x-ms-client-principal` header (Azure SWA injects user claims)
3. See `app/src/services/auth.ts` for client integration pattern

### API Communication
- All endpoints prefixed with `/api/`
- Frontend uses `apiClient.ts` for type-safe API calls
- CORS configured in `Program.cs` to allow frontend origin

### Data Storage
- **Cosmos DB** connection string in `local.settings.json` → `Values:CosmosConnectionString`
- Production secrets in Azure App Settings (never commit connection strings)
- Repository pattern abstracts Cosmos operations

## Common Change Patterns

### Adding a New Prediction Field
1. Update `api/Models/Prediction.cs` (backend model)
2. Update `app/src/types/prediction.ts` (frontend type)
3. Update `app/src/components/matches/PredictionForm.tsx` (UI)
4. Update repository query logic if needed

### Adding a New Azure Function Endpoint
1. Create `api/Functions/NewFunction.cs` with `[Function("NewFunction")]`
2. Inject dependencies via constructor (repositories, services)
3. Add corresponding method in `app/src/services/apiClient.ts`
4. Wire up frontend component to call the new API method

### Modifying Scoring Logic
- All scoring in `api/Services/ScoringService.cs` → `CalculatePoints()` method
- If score structure changes, sync `api/Models/Score.cs` and `app/src/types/ranking.ts`

## Critical Files to Create First
When scaffolding the project, set up these files in order:
1. `api/Program.cs` — DI container and Cosmos configuration
2. `app/src/services/apiClient.ts` — API client with endpoint patterns
3. `api/Models/*.cs` — Domain models (Match, Prediction, Score, UserProfile)
4. `app/src/types/*.ts` — Corresponding TypeScript types
5. `app/router.tsx` — Route definitions
6. `.github/workflows/azure-static-web-apps.yml` — CI/CD pipeline

## Security Notes
- **Never commit** `api/local.settings.json` with real credentials
- Use Azure Key Vault references in production app settings
- Azure SWA handles auth — no password management in code
- Enable CORS only for known frontend origins in `Program.cs`
