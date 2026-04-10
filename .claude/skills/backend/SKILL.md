---
name: backend
description: Conocimiento del backend Azure Functions (.NET 8) del proyecto Francachela World Cup 2026 — endpoints, autenticación JWT, repositorios EF Core, migraciones, servicios (scoring, email, football-data), Wompi y convenciones de funciones. Usar cuando se trabaje en api/Functions/, api/Services/, api/Infrastructure/ o se necesite agregar/modificar endpoints o lógica de servidor.
---

# Backend — Francachela World Cup 2026

Azure Functions en .NET 8 (isolated worker) con Entity Framework Core sobre Azure SQL Server. Ubicación: [api/](api/).

## Comandos típicos

Desde `api/`:
- `func start` — runtime local en puerto 7071 (requiere Azure Functions Core Tools v4)
- `dotnet build` — compilar
- `dotnet ef migrations add NombreMigracion` — nueva migración EF
- `dotnet ef database update` — aplica migraciones a la BD configurada en `SqlConnectionString`

Variables locales en `api/local.settings.json`. En Azure se configuran como App Settings del Function App.

## Estructura

```
api/
├── Program.cs                    # DI registration, CORS, EF, App Insights
├── host.json
├── api.csproj
├── Functions/                    # Endpoints HTTP (1 archivo = 1 dominio funcional)
├── Services/                     # JwtService, ScoringService, EmailService, FootballDataService, TokenService, NotificationService, TimeProviderService, EncryptionService, SecureTokenService
├── Infrastructure/
│   ├── AppDbContext.cs           # DbContext + OnModelCreating con índices y FKs
│   ├── AppDbContextFactory.cs    # Para EF tooling
│   ├── Entities/                 # UserEntity, MatchEntity, PredictionEntity, ScoreEntity, EventEntity, RaffleEntity, RaffleParticipantEntity, RaffleWinnerEntity, PaymentEntity, InvitationEntity
│   ├── Repositories/
│   │   ├── Interfaces/IXxxRepository.cs
│   │   └── Implementations/XxxRepository.cs
│   └── Migrations/               # EF Core migrations
├── Models/                       # DTOs (Match, Prediction, AdminRequests, AuthenticationRequests, WompiModels, UserProfile, Invitation)
└── Extensions/MatchMappingExtensions.cs
```

## Functions disponibles

| Function | Ruta | Descripción |
|---|---|---|
| `Login` | `POST auth/login` | Email/password → JWT |
| `GetProfile` | `GET auth/profile` | Perfil del usuario JWT |
| `RegisterUser` | `POST auth/register` | Registro con invitación |
| `PreRegister` | `POST auth/pre-register` | Pre-registro con pago |
| `ValidateInvitation` | `GET invitations/validate` | Verificar token invitación |
| `GetMatches` | `GET matches` | Todos los partidos (auto SCHEDULED→LIVE) |
| `SyncMatches` | `POST sync-matches` | Sync desde Football-Data.org (admin) |
| `SyncResults` | `GET sync-results` | Aplica resultados y calcula puntos |
| `UpsertPrediction` | `POST predictions` | Crea/actualiza predicción (auth + cutoff) |
| `GetMyPredictions` | `GET predictions/me` | Predicciones del usuario JWT |
| `GetRanking` | `GET ranking` | Leaderboard con puntos calculados dinámicamente |
| `Raffles*` | `GET/POST raffles` | CRUD rifas + join + draw |
| `AdminUsers/Invitations/Raffles/Events` | `mgmt/*` | Endpoints admin |
| `WompiWebhook` | `POST wompi/webhook` | Notificaciones de pago |
| `FootballData*` | `GET besoccer/* football/*` | Proxy/test del proveedor externo |

Ver listado completo en [api/FUNCTIONS_IMPLEMENTADAS.md](api/FUNCTIONS_IMPLEMENTADAS.md).

## Autenticación JWT (CRÍTICO)

**Nunca leer** `X-MS-CLIENT-PRINCIPAL-ID` para extraer userId. Azure EasyAuth NO está activo. Usar siempre `JwtService`:

```csharp
// Patrón estándar para obtener userId desde request
private string? ExtractUserIdFromJwt(HttpRequestData req)
{
    var authHeader = req.Headers
        .FirstOrDefault(h => h.Key == "Authorization").Value?.FirstOrDefault();
    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        return null;
    var token = authHeader.Substring("Bearer ".Length);
    var principal = _jwtService.ValidateToken(token);
    return _jwtService.ExtractUserId(principal);
}
```

`JwtService` se inyecta en el constructor de la función. Está registrado en `Program.cs` como `AddScoped<JwtService>()`.

Para roles admin: usar `_jwtService.ExtractRole(principal)` y comparar con `"admin"`. Para validación con DB (anti-escalación), usar `SecureTokenService`.

Ver: [api/Services/JwtService.cs](api/Services/JwtService.cs), [api/Functions/GetProfileFunction.cs](api/Functions/GetProfileFunction.cs), [api/Functions/PredictionsFunction.cs](api/Functions/PredictionsFunction.cs).

## Patrón estándar de una Function

```csharp
public class XxxFunction
{
    private readonly IXxxRepository _repo;
    private readonly JwtService _jwtService;
    private readonly ILogger<XxxFunction> _logger;

    public XxxFunction(IXxxRepository repo, JwtService jwtService, ILogger<XxxFunction> logger)
    { _repo = repo; _jwtService = jwtService; _logger = logger; }

    [Function("OperationName")]  // nombre único en TODO el proyecto
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "xxx")] HttpRequestData req)
    {
        var userId = ExtractUserIdFromJwt(req);
        if (string.IsNullOrEmpty(userId))
            return await Error(req, "No autenticado", HttpStatusCode.Unauthorized);

        var body = await req.ReadFromJsonAsync<XxxRequest>();
        // validar...
        var result = await _repo.DoSomethingAsync(userId, body);

        var ok = req.CreateResponse(HttpStatusCode.OK);
        await ok.WriteAsJsonAsync(result);
        return ok;
    }
}
```

`AuthorizationLevel.Anonymous` siempre — la auth real es el JWT validado dentro de la función, no el sistema de keys de Functions.

## Repositorios y EF Core

- Cada entidad tiene `IXxxRepository` + `XxxRepository` con CRUD básico (`GetByIdAsync`, `GetAllAsync`, `CreateAsync`, `UpdateAsync`, `UpsertAsync`, `DeleteAsync`).
- **Sólo los repositorios tocan `AppDbContext`**. Las funciones nunca instancian `AppDbContext` directamente.
- `OnModelCreating` en `AppDbContext.cs` define índices únicos importantes:
  - `Users.Email` único
  - `Predictions(UserId, MatchId)` único
  - `Scores.UserId` único
  - `Payments.WompiTransactionId` único
- Cascadas configuradas: `Predictions` se borran en cascada con User/Match.

## Servicios

| Servicio | Función |
|---|---|
| `JwtService` | Generar/validar JWT con HmacSha256, claims `sub`, `email`, `role` |
| `ScoringService` | Calcular `PointsEarned` por predicción según resultado real |
| `EmailService` | Envío de emails vía Resend (HttpClient inyectado) |
| `FootballDataService` | Cliente Football-Data.org (matches, standings, fixtures) |
| `TokenService` | Encriptar/desencriptar tokens de invitación |
| `SecureTokenService` | Validación de token + verificación de rol contra DB |
| `EncryptionService` | AES helpers |
| `NotificationService` | Notificaciones internas |
| `TimeProviderService` | `DateTime.UtcNow` mockeable (interface `ITimeProviderService`) |

Todos registrados en `Program.cs`.

## Reglas de tiempo (CRÍTICO)

- **Hora Colombia (UTC-5)** se almacena directamente en BD en `MatchEntity.MatchDate`. NO almacenar UTC.
- Para comparar "ahora" usar `DateTime.UtcNow.AddHours(-5)`.
- `MatchEntity.KickoffAtUtc` es un alias `[NotMapped]` que apunta a `MatchDate` (compatibilidad).
- Cutoff de predicciones: 1 minuto antes del kickoff.
- Auto SCHEDULED→LIVE se hace en memoria dentro de `MatchRepository.GetAllAsync()`.

## Sistema de puntos

- `ScoringService` define los puntos. Reglas típicas: marcador exacto > ganador correcto > nada.
- `PointsEarned` se persiste en `PredictionEntity` cuando se aplica un resultado.
- El total del usuario **NO** se almacena: `RankingFunction` lo calcula sumando `PointsEarned` de todas las predicciones del usuario en cada llamada.
- `UserEntity.TotalPoints` puede existir pero no es la fuente de verdad para el ranking.

## Sincronización de partidos/resultados

- `SyncMatchesFunction` consulta Football-Data.org y crea/actualiza `MatchEntity`. Soporta `competition=laliga|worldcup` y rangos de fechas.
- `SyncResultsFunction` aplica scores finales y dispara `ScoringService` sobre las predicciones de cada partido.
- En producción NO hay timer trigger (limitación de SWA): el frontend dispara `syncResults` al cargar páginas relevantes.

## Migraciones EF

- Crear: `dotnet ef migrations add NombreDescriptivo` desde `api/`.
- Las migraciones existen en `api/Infrastructure/Migrations/`.
- En despliegue, las migraciones se aplican manualmente o vía script (no se aplican automáticamente al iniciar).
- Migraciones existentes:
  - `20260404025057_InitialCreate`
  - `20260404185919_AddPaymentEntityAndWompiSupport`
  - `20260405150542_AddRankingAndRafflesEndpoints`
  - `20260406162543_AddTournamentIdToMatches`

## Wompi (pagos)

- `WompiWebhookFunction` recibe notificaciones, valida firma, actualiza `PaymentEntity` y dispara post-pago (activar usuario, enviar email).
- `PaymentEntity` indexada por `WompiTransactionId`, `UserId`, `(Status, CreatedAtUtc)`, `WompiReference`.
- Estados: pendiente → aprobado/rechazado.
- Documentación en `IMPLEMENTACION_WOMPI_FRONTEND.md`, `RESUMEN_IMPLEMENTACION_WOMPI.md`.

## CORS

Configurado en `Program.cs` con política `AllowStaticWebApp`: permite `http://localhost:5173` (Vite dev) y `https://*.azurestaticapps.net` (producción) con credenciales.

## Convenciones

- Cada `[Function("Name")]` debe ser **único** en todo el proyecto (Azure Functions runtime lo exige; ya hubo conflictos con `GetLeagues`/`GetStandings`).
- Inyección de dependencias siempre por constructor.
- Logging con `ILogger<XxxFunction>`.
- Errores: try/catch en el `Run()`, log con `LogError`, devolver `HttpResponseData` con status apropiado y body JSON.
- Async/await en TODO. Nunca `.Result` ni `.Wait()`.
- DTOs en `Models/`, entidades en `Infrastructure/Entities/`. NO devolver entities directamente al frontend — mapear a Model.

## Documentación complementaria

- `api/AUTHENTICATION_API.md`, `api/SECURITY_JWT.md`
- `api/FUNCTIONS.md`, `api/FUNCTIONS_IMPLEMENTADAS.md`
- `api/SCHEDULED_FUNCTIONS.md`
- `api/REGISTRATION_FLOW.md`
- `api/TESTING_WITH_LALIGA.md`
- `api/FIFA_API_README.md`
- `MIGRATION_GUIDE.md`, `ESQUEMA_BD.md`
