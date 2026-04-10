---
name: arquitectura
description: Conocimiento general de la arquitectura del proyecto Francachela World Cup 2026 — stack, capas, despliegue Azure, autenticación JWT, base de datos SQL Server, flujo de datos entre frontend y backend, y convenciones globales. Usar cuando se necesite contexto general del sistema, decisiones arquitectónicas, integración entre capas o despliegue.
---

# Arquitectura — Francachela World Cup 2026

Polla mundialista oficial de Francachela MX Subachoque. Permite a usuarios invitados predecir resultados de partidos del Mundial 2026 (y La Liga como entorno de pruebas), acumular puntos y participar en rifas.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Material UI (MUI) |
| Backend | Azure Functions (.NET 8 isolated worker) en C# |
| Base de datos | Azure SQL Server con Entity Framework Core (Code-First + Migrations) |
| Auth | JWT propio (HmacSha256) — **NO** usa Azure EasyAuth |
| Hosting | Azure Static Web Apps (frontend + API integrada como `/api/*`) |
| Pagos | Wompi (Colombia) |
| Email | Resend |
| Datos deportivos | Football-Data.org API |

## Estructura del repositorio

```
WorldCup2026/
├── app/                 # Frontend React
│   ├── src/
│   │   ├── pages/       # RankingPage, MatchesPage, AdminPage, etc.
│   │   ├── components/  # sections/, ui/, admin/, auth/, matches/, raffles/
│   │   ├── hooks/       # useRanking, useMatches, usePredictions, useAuthUser, etc.
│   │   ├── services/    # apiClient.ts, auth.ts
│   │   ├── types/       # match.ts, prediction.ts, ranking.ts, admin.ts
│   │   └── router.tsx
│   └── staticwebapp.config.json
├── api/                 # Azure Functions backend
│   ├── Functions/       # Endpoints HTTP (1 función = 1 archivo)
│   ├── Services/        # JwtService, ScoringService, EmailService, etc.
│   ├── Infrastructure/
│   │   ├── Entities/    # EF Core entities (UserEntity, MatchEntity, ...)
│   │   ├── Repositories/ # Interfaces + Implementations
│   │   ├── Migrations/  # EF Core migrations
│   │   └── AppDbContext.cs
│   ├── Models/          # DTOs / request/response models
│   ├── Extensions/      # Mapping extensions entity → model
│   └── Program.cs       # DI registration
└── .claude/skills/      # Skills de este proyecto
```

## Capas y separación de responsabilidades

```
Frontend (React)
   ↓ fetch JSON con Bearer JWT
Azure Functions (Functions/*.cs)
   ↓ usa
Repositories (Infrastructure/Repositories/*)
   ↓ usa
DbContext (EF Core) → SQL Server
```

- **Functions** = Controllers. Validan auth, parsean body, llaman repositorios, devuelven `HttpResponseData`.
- **Repositories** = única capa que toca `AppDbContext`.
- **Services** = lógica transversal (JWT, scoring, email, sync externo).
- **Models** = DTOs hacia el frontend. **Entities** = mapeo a tablas SQL.
- **Extensions/MatchMappingExtensions.cs** convierte entity ↔ model.

## Autenticación (CRÍTICO)

El sistema usa **JWT propio**, no Azure EasyAuth. Los headers `X-MS-CLIENT-PRINCIPAL-*` **no existen** en este deploy.

Flujo:
1. `POST /api/auth/login` → `JwtService.GenerateToken(user)` → devuelve token.
2. Frontend guarda token con `services/auth.ts` (`getStoredToken()`).
3. `apiClient.ts` lo envía como `Authorization: Bearer <token>` en cada request.
4. Cada función protegida debe validar con `JwtService.ValidateToken(token)` y extraer userId con `JwtService.ExtractUserId(principal)`.

**Nunca leer** `X-MS-CLIENT-PRINCIPAL-ID` para obtener el usuario — usar siempre el JWT del header `Authorization`.

Ver: [api/Services/JwtService.cs](api/Services/JwtService.cs), [api/Functions/GetProfileFunction.cs](api/Functions/GetProfileFunction.cs).

## Despliegue

- **Static Web Apps** sirve el bundle de Vite y enruta `/api/*` al Functions App.
- `staticwebapp.config.json` permite todas las rutas `/api/*` como anonymous (la auth real es JWT, no SWA).
- Variables de entorno requeridas en Azure: `SqlConnectionString`, `Jwt:SecretKey` (≥32 chars), `Jwt:Issuer`, `Jwt:Audience`, `Jwt:ExpirationMinutes`, credenciales Wompi/Resend/Football-Data.
- En local el frontend detecta `localhost` y apunta a `http://localhost:7071/api`; en producción usa `/api`.

## Decisiones arquitectónicas activas

- **Tiempos de partidos**: Almacenados en hora Colombia (UTC-5) directamente en BD para evitar conversiones. Comparar contra `DateTime.UtcNow.AddHours(-5)`.
- **Puntos del ranking**: Calculados dinámicamente en `RankingFunction` sumando `PointsEarned` de las predicciones — NO se guarda total agregado en `UserEntity`.
- **Sincronización de resultados**: Disparada desde el frontend al cargar la página (limitación de SWA, no hay timers). Ver `useSyncResults` y `SyncResultsFunction`.
- **Auto SCHEDULED→LIVE**: Se calcula en memoria dentro de `MatchRepository.GetAllAsync()` comparando con hora Colombia.
- **Tournaments**: La columna `TournamentId` distingue La Liga (pruebas) vs Mundial. Marcada como `[NotMapped]` en `MatchEntity`.

## Convenciones globales

- Idioma del usuario y mensajes UI: **español**. Comentarios de código: español o inglés indistinto.
- Nombres de funciones Azure únicos en todo el proyecto (atributo `[Function("Nombre")]`).
- Cada `Function` se registra automáticamente; los repositorios y servicios se registran manualmente en `Program.cs`.
- Migraciones EF: crear con `dotnet ef migrations add Nombre` desde `api/`. Las migraciones existentes están en `api/Infrastructure/Migrations/`.

## Documentación complementaria del repo

- `DOCUMENTACION_PROYECTO.md`, `ESQUEMA_BD.md`, `ESTRUCTURA_BD.md` — esquema y modelo de datos
- `DEPLOY_AZURE.md` — pasos de despliegue
- `SECURITY_JWT.md`, `AUTHENTICATION_API.md` — auth
- `FUNCTIONS_IMPLEMENTADAS.md` — listado de endpoints
- `MIGRATION_GUIDE.md` — guía de migraciones EF
