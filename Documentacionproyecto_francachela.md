# 🏆 Documentación del Proyecto — Francachela Mundial 2026

> Plataforma de predicciones del Mundial FIFA 2026 con sistema de rifas, ranking y panel de administración.  
> Fecha de generación: Abril 2026

---

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Estructura del Monorepo](#2-estructura-del-monorepo)
3. [Infraestructura y Base de Datos](#3-infraestructura-y-base-de-datos)
4. [Backend — Azure Functions](#4-backend--azure-functions)
5. [Endpoints de la API](#5-endpoints-de-la-api)
6. [Frontend — Vistas y Páginas](#6-frontend--vistas-y-páginas)
7. [Frontend — Componentes](#7-frontend--componentes)
8. [Frontend — Hooks](#8-frontend--hooks)
9. [Frontend — Servicios y Tipos](#9-frontend--servicios-y-tipos)
10. [Flujo de Autenticación](#10-flujo-de-autenticación)
11. [Sistema de Puntuación](#11-sistema-de-puntuación)
12. [Variables de Entorno](#12-variables-de-entorno)
13. [Comandos de Desarrollo](#13-comandos-de-desarrollo)

---

## 1. Visión General

Francachela Mundial 2026 es una aplicación web privada e invitacional que permite a un grupo de participantes:

- **Predecir** resultados de partidos del Mundial 2026
- **Ganar puntos** según la exactitud de sus predicciones
- **Ver el ranking** en tiempo real de todos los participantes
- **Participar en rifas** organizadas por el administrador
- **Acceder a información** de las reglas del torneo y el sistema de puntos

Solo los usuarios con invitación válida pueden registrarse. El administrador gestiona invitaciones, usuarios y rifas desde un panel dedicado.

---

## 2. Estructura del Monorepo

```
WorldCup2026/
├── app/                    # Frontend — React 18 + TypeScript + Vite
│   └── src/
│       ├── pages/          # Vistas principales (páginas)
│       ├── components/     # Componentes reutilizables
│       ├── hooks/          # React hooks custom
│       ├── services/       # Clientes de API y auth
│       └── types/          # Tipos TypeScript compartidos
│
├── api/                    # Backend — .NET 8 Azure Functions (isolated worker)
│   ├── Functions/          # HTTP-triggered Azure Functions (endpoints)
│   ├── Services/           # Lógica de negocio
│   ├── Infrastructure/
│   │   ├── Entities/       # Entidades EF Core (tablas de BD)
│   │   ├── Repositories/   # Patrón repositorio (acceso a datos)
│   │   └── Migrations/     # Migraciones EF Core
│   ├── Models/             # DTOs de respuesta/request de la API
│   ├── Program.cs          # Configuración DI, CORS, servicios
│   └── local.settings.json # Configuración local (gitignored)
│
└── .github/
    └── copilot-instructions.md
```

**Stack tecnológico:**

| Capa       | Tecnología                                             |
|------------|--------------------------------------------------------|
| Frontend   | React 18, TypeScript, Vite, React Router v6, MUI v5   |
| Backend    | .NET 8, Azure Functions v4 (isolated worker)          |
| Base de datos | SQL Server (Entity Framework Core 8)              |
| Auth       | JWT (HS256) + sistema de invitaciones con token cifrado |
| Email      | SendGrid                                               |
| WhatsApp   | Twilio                                                 |
| Datos fútbol | Football-Data.org API                               |
| Observabilidad | Application Insights                             |

---

## 3. Infraestructura y Base de Datos

### 3.1 AppDbContext (`api/Infrastructure/AppDbContext.cs`)

Contexto de Entity Framework Core con las siguientes colecciones/tablas:

| DbSet              | Entidad                     | Descripción                        |
|--------------------|-----------------------------|------------------------------------|
| `Users`            | `UserEntity`                | Usuarios registrados               |
| `Invitations`      | `InvitationEntity`          | Invitaciones enviadas              |
| `Matches`          | `MatchEntity`               | Partidos del Mundial               |
| `Predictions`      | `PredictionEntity`          | Predicciones de usuarios           |
| `Scores`           | `ScoreEntity`               | Puntuaciones en el ranking         |
| `Events`           | `EventEntity`               | Eventos especiales (watch parties) |
| `Raffles`          | `RaffleEntity`              | Rifas                              |
| `RaffleParticipants` | `RaffleParticipantEntity` | Participantes en rifas             |
| `RaffleWinners`    | `RaffleWinnerEntity`        | Ganadores de rifas                 |

### 3.2 Entidades

#### `UserEntity`
```
Id (GUID) | Email (unique, 256) | DisplayName (100) | PasswordHash
Status: active | inactive | banned
Role: user | admin
Gender: male | female | other
TotalPoints | TotalPredictions | CorrectPredictions | AccuracyPercentage | LeaderboardRank
CreatedAt | LastLoginAt
→ Predictions, Scores, RaffleParticipations, RaffleWins
```

#### `MatchEntity`
```
Id (GUID) | HomeTeam | AwayTeam | Stage | Group | KickoffAtUtc
Status: scheduled | live | finished
HomeScore (nullable) | AwayScore (nullable)
Venue | ExternalId (Football-Data.org)
→ Predictions
```

#### `PredictionEntity`
```
Id (GUID) | UserId (FK) | MatchId (FK)
PredictedHomeScore | PredictedAwayScore | PredictedWinner
PointsEarned | CreatedAt | UpdatedAt
Índice único: (UserId, MatchId)
```

#### `InvitationEntity`
```
Id (GUID) | Email (256) | Token (512, unique) | Status: pending | used | expired
CreatedAtUtc | ExpiresAtUtc
NotificationChannel: email | whatsapp
PhoneNumber (opcional)
```

#### `RaffleEntity`
```
Id (GUID) | Title (200) | Description | Prize | NumberOfWinners
ParticipationMode: all | first_N | manual | gender
MaxParticipants (nullable) | TargetGender (nullable)
Status: open | closed | drawn
DrawAt | CreatedAt | CreatedBy
→ Participants, Winners
```

#### `EventEntity`
```
Id (GUID) | Title (200) | Description | Type | Date
Location | LocationUrl | MaxCapacity
Status: active | cancelled
CreatedAtUtc | CreatedBy
```

#### `ScoreEntity`
```
Id (GUID) | UserId (FK, único)
TotalPoints | ExactScores | CorrectWinners | Rank
```

### 3.3 Repositorios (`api/Infrastructure/Repositories/`)

Todos los repositorios implementan la interfaz correspondiente e inyectan `AppDbContext`.

| Interfaz                | Implementación           | Entidad           |
|-------------------------|--------------------------|-------------------|
| `IUserRepository`       | `UserRepository`         | `UserEntity`      |
| `IInvitationRepository` | `InvitationRepository`   | `InvitationEntity`|
| `IMatchRepository`      | `MatchRepository`        | `MatchEntity`     |
| `IPredictionRepository` | `PredictionRepository`   | `PredictionEntity`|
| `IScoreRepository`      | `ScoreRepository`        | `ScoreEntity`     |
| `IRaffleRepository`     | `RaffleRepository`       | `RaffleEntity`    |
| `IEventRepository`      | `EventRepository`        | `EventEntity`     |

### 3.4 Servicios del Backend (`api/Services/`)

| Servicio               | Interfaz               | Responsabilidad                                              |
|------------------------|------------------------|--------------------------------------------------------------|
| `ScoringService`       | `IScoringService`      | Calcular puntos por predicción (exacto=3, ganador=1, fallo=0)|
| `JwtService`           | —                      | Generar y validar tokens JWT (HS256)                        |
| `TokenService`         | —                      | Cifrar/descifrar tokens de invitación + generar códigos     |
| `SecureTokenService`   | —                      | Validar token JWT + verificar rol admin contra BD           |
| `FootballDataService`  | `IFootballDataService` | Consultar partidos desde Football-Data.org                  |
| `TimeProviderService`  | `ITimeProviderService` | Abstracción de `DateTime.UtcNow` (testable)                 |
| `EncryptionService`    | —                      | Utilidades de cifrado AES                                   |
| `NotificationService`  | —                      | Envío de email vía SendGrid / WhatsApp vía Twilio           |
| `AuthenticationService`| —                      | Lógica de autenticación auxiliar                            |

---

## 4. Backend — Azure Functions

El backend está construido con **.NET 8 Azure Functions v4 (isolated worker)**.  
Todas las funciones usan `AuthorizationLevel.Anonymous` — la seguridad se gestiona a nivel de JWT en el código (no a nivel de host key).

### Configuración (`Program.cs`)

- **CORS**: Permite `http://localhost:5173` (dev) y `https://*.azurestaticapps.net` (prod)
- **EF Core**: SQL Server con `SqlConnectionString` del entorno
- **DI**: Scoped para repositorios y `ScoringService`; Singleton para `TimeProviderService`; HttpClient para `FootballDataService`
- **Application Insights** habilitado

### 4.1 `LoginFunction.cs`
Ruta: `POST /api/auth/login`  
Autenticación con email y contraseña (BCrypt). Devuelve JWT + perfil del usuario.  
Seguridad: No revela si el email existe o no.

### 4.2 `RegisterUserFunction.cs`
Ruta: `POST /api/auth/register`  
Registro mediante token de invitación válido. Valida el token cifrado, verifica la invitación en BD, crea el usuario con hash BCrypt y devuelve JWT.

### 4.3 `ValidateInvitationFunction.cs`
Ruta: `GET /api/auth/validate-invitation?token=...`  
Verifica si un token de invitación es válido, no expirado y no usado. Devuelve el email asociado.

### 4.4 `GetProfileFunction.cs`
Ruta: `GET /api/auth/profile`  
Requiere `Authorization: Bearer <JWT>`. Devuelve el perfil completo del usuario autenticado.

### 4.5 `MatchesFunction.cs`
Ruta: `GET /api/matches`  
Devuelve la lista de partidos próximos desde la BD. No requiere autenticación. Documentado con OpenAPI.

### 4.6 `PredictionsFunction.cs`
Rutas:
- `POST /api/predictions` — Crear/actualizar predicción (cierre: 1 minuto antes del partido)
- `GET /api/predictions/me` — Mis predicciones
- `GET /api/predictions/match/{matchId}` — Predicciones de un partido

Lee el userId desde la cabecera `X-MS-CLIENT-PRINCIPAL-ID` (Azure SWA) o desde el JWT.

### 4.7 `FootballDataFunction.cs`
Rutas:
- `GET /api/footballdata/fixtures` — Partidos del Mundial desde Football-Data.org (con fallback a BD)
- `GET /api/footballdata/results` — Partidos finalizados con resultados

Fallback automático a datos locales si la API externa falla.

### 4.8 `AdminInvitationsFunction.cs`
Rutas (requieren rol admin vía JWT):
- `POST /api/admin/invitations` — Crear invitación (genera token cifrado AES + link de registro)
- `GET /api/admin/invitations` — Listar todas las invitaciones

Valida token admin con `SecureTokenService` (verifica rol contra BD, previene escalada de privilegios).

### 4.9 `AdminUsersFunction.cs`
Rutas (requieren rol admin):
- `GET /api/admin/users` — Listar todos los usuarios
- `PATCH /api/admin/users/{userId}/status` — Cambiar estado: `active | inactive | banned`
- `POST /api/admin/users/{userId}/reset-password` — Reset de contraseña

### 4.10 `AdminRafflesFunction.cs`
Rutas (requieren rol admin):
- `POST /api/admin/raffles` — Crear rifa (modos: `all`, `first_N`, `manual`, `gender`)
- `GET /api/admin/raffles` — Listar rifas
- `POST /api/admin/raffles/{id}/draw` — Ejecutar sorteo (algoritmo Fisher-Yates)
- `POST /api/admin/raffles/{id}/participants` — Agregar participante
- `DELETE /api/admin/raffles/{id}/participants/{userId}` — Eliminar participante

### 4.11 `AdminEventsFunction.cs`
Rutas (requieren rol admin):
- `POST /api/admin/events` — Crear evento (watch party, reunión, actividad)
- `GET /api/admin/events` — Listar eventos
- `PUT /api/admin/events/{id}` — Actualizar evento
- `DELETE /api/admin/events/{id}` — Cancelar evento

### 4.12 `SendNotificationFunction.cs`
Ruta: `POST /api/notifications/send` (nivel `Function`, solo servidor)  
Envía invitación por **email** (SendGrid) o **WhatsApp** (Twilio) según el canal configurado.

---

## 5. Endpoints de la API

Base URL: `http://localhost:7071/api` (dev) · `https://<swa>.azurestaticapps.net/api` (prod)

### Autenticación

| Método | Ruta                          | Auth     | Descripción                        |
|--------|-------------------------------|----------|------------------------------------|
| POST   | `/auth/login`                 | Público  | Login con email + contraseña       |
| POST   | `/auth/register`              | Público  | Registro con token de invitación   |
| GET    | `/auth/validate-invitation`   | Público  | Validar token de invitación        |
| GET    | `/auth/profile`               | JWT      | Obtener perfil del usuario         |

### Partidos

| Método | Ruta                          | Auth     | Descripción                        |
|--------|-------------------------------|----------|------------------------------------|
| GET    | `/matches`                    | —        | Listar partidos próximos           |
| GET    | `/footballdata/fixtures`      | —        | Partidos desde Football-Data.org   |
| GET    | `/footballdata/results`       | —        | Resultados finalizados             |

### Predicciones

| Método | Ruta                          | Auth     | Descripción                        |
|--------|-------------------------------|----------|------------------------------------|
| POST   | `/predictions`                | SWA/JWT  | Crear o actualizar predicción      |
| GET    | `/predictions/me`             | SWA/JWT  | Mis predicciones                   |
| GET    | `/predictions/match/{matchId}`| SWA/JWT  | Predicciones de un partido         |

### Ranking

| Método | Ruta      | Auth | Descripción           |
|--------|-----------|------|-----------------------|
| GET    | `/ranking` | —   | Tabla de puntuaciones |

### Rifas

| Método | Ruta                          | Auth | Descripción                  |
|--------|-------------------------------|------|------------------------------|
| GET    | `/raffles`                    | —    | Listar rifas activas         |
| GET    | `/raffles/{id}`               | —    | Detalle de una rifa          |
| POST   | `/raffles/{id}/join`          | JWT  | Unirse a una rifa            |
| POST   | `/raffles/{id}/draw`          | JWT  | Realizar sorteo (admin)      |

### Admin

| Método | Ruta                                  | Auth  | Descripción                  |
|--------|---------------------------------------|-------|------------------------------|
| GET    | `/admin/users`                        | Admin | Listar usuarios              |
| PATCH  | `/admin/users/{userId}/status`        | Admin | Cambiar estado de usuario    |
| POST   | `/admin/users/{userId}/reset-password`| Admin | Reset de contraseña          |
| POST   | `/admin/invitations`                  | Admin | Crear invitación             |
| GET    | `/admin/invitations`                  | Admin | Listar invitaciones          |
| POST   | `/admin/raffles`                      | Admin | Crear rifa                   |
| GET    | `/admin/raffles`                      | Admin | Listar rifas                 |
| POST   | `/admin/raffles/{id}/draw`            | Admin | Ejecutar sorteo              |
| POST   | `/admin/events`                       | Admin | Crear evento                 |
| GET    | `/admin/events`                       | Admin | Listar eventos               |
| PUT    | `/admin/events/{id}`                  | Admin | Actualizar evento            |
| DELETE | `/admin/events/{id}`                  | Admin | Cancelar evento              |
| POST   | `/notifications/send`                 | Func  | Enviar notificación          |

---

## 6. Frontend — Vistas y Páginas

El frontend usa **React Router v6** con rutas definidas en `app/src/router.tsx`.  
Todas las rutas (excepto `/login`) están protegidas por `<RequireAuth />`.

### Estructura de rutas

```
/login              → LoginPage        (público)
/                   → MatchesPage      (protegida)
/matches            → MatchesPage      (protegida)
/ranking            → RankingPage      (protegida)
/participants       → ParticipantsPage (protegida)
/raffles            → RafflesPage      (protegida)
/info               → InfoPage         (protegida)
/admin              → AdminPage        (protegida, solo admin)
```

---

### 6.1 `LoginPage` — `/login`

**Descripción:** Página de entrada al sistema. Muestra dos modos: login y registro.  
**Componentes usados:** `FrancachelaLogo`, `FrancachelaWatermark`  
**Estado local:** `mode: 'login' | 'register'`  
**Lógica:** Si el usuario ya está autenticado, redirige a `/matches`.  
**Autenticación:** Integra `useAuthUser` para detectar sesión activa.

---

### 6.2 `MatchesPage` — `/matches`

**Descripción:** Vista principal. Lista los partidos del Mundial organizados en tres tabs: Disponibles (SCHEDULED), En vivo (LIVE), Finalizados (FINISHED).  
**Hooks usados:** `useMatches`, `usePredictions`  
**Componentes usados:** `HeroMatches`, `MatchCard`, `ResultCard`, `PredictionForm`, `ChampionPicker`  
**Estado local:**
- `tabValue` — tab activo
- `selectedMatch` — partido seleccionado para predecir
- `showPredictionForm` — toggle del formulario
- `selectedStages` — filtro por fase del torneo

**Comportamiento:**
- Filtra partidos por estado y por fase
- Al hacer clic en "Predecir" abre `PredictionForm` en modal
- Muestra la predicción guardada en cada `MatchCard`
- Incluye `ChampionPicker` para predecir el campeón

---

### 6.3 `RankingPage` — `/ranking`

**Descripción:** Tabla de clasificación general de todos los participantes.  
**Componentes usados:** `HeroLeaderboard`, `LeaderboardTable`  
**Sin estado local significativo.** Los datos se cargan en `LeaderboardTable` mediante hook.

---

### 6.4 `ParticipantsPage` — `/participants`

**Descripción:** Listado detallado de todos los participantes con búsqueda y ordenamiento.  
**Hooks usados:** `useRanking`, `useAuthUser`  
**Estado local:** `searchText`, `sortBy: 'points' | 'predictions' | 'exactos' | 'alfabetico'`  
**Comportamiento:**
- Búsqueda en tiempo real por nombre
- Ordenamiento por puntos, cantidad de predicciones, marcadores exactos o nombre
- Resalta visualmente al usuario autenticado en la tabla

---

### 6.5 `RafflesPage` — `/raffles`

**Descripción:** Gestión de rifas. Muestra rifas activas, en sorteo y completadas.  
**Hooks usados:** `useRaffles`  
**Componentes usados:** `HeroRaffles`, `RaffleCard`, `RaffleJoinDialog`  
**Estado local:** `tabValue`, `selectedRaffle`, `dialogOpen`  
**Comportamiento:**
- Tabs por estado: Abiertas / En Sorteo / Completadas
- Al hacer clic en "Participar" abre `RaffleJoinDialog`
- Confirmar participación llama a `useRaffles.join(raffleId, tickets)`

---

### 6.6 `InfoPage` — `/info`

**Descripción:** Página informativa con reglas del juego y sistema de puntos.  
**Componentes usados:** `HeroInfo`  
**Estado local:** `tabValue`  
**Contenido:**
- Tab 1: Reglas de predicciones (cuándo cierra, cómo puntuar, desempate)
- Tab 2: Sistema de puntos (tabla con ejemplos)
- Tab 3: Fases del torneo (grupos, octavos, cuartos, semis, final)

---

### 6.7 `AdminPage` — `/admin`

**Descripción:** Panel de administración completo. Solo accesible por usuarios con rol `admin`.  
**Hooks usados:** `useAdmin`, `useRaffles`  
**Componentes usados:** `InvitationForm`, `UserTable`, `RaffleManager`  
**Estado local:** `tabValue`  
**Tabs:**
1. **Invitaciones** — Enviar invitaciones y ver estado
2. **Usuarios** — Ver todos los usuarios, activar/desactivar, reset de contraseña
3. **Rifas** — Crear y gestionar rifas

---

## 7. Frontend — Componentes

### 7.1 Layout (`app/src/components/Layout/`)

| Componente  | Descripción                                                   |
|-------------|---------------------------------------------------------------|
| `Layout.tsx`| Wrapper principal de todas las páginas protegidas             |
| `Navbar.tsx`| Barra de navegación superior con links y menú de usuario      |
| `Footer.tsx`| Pie de página con información del proyecto                    |

---

### 7.2 Auth (`app/src/components/auth/`)

| Componente      | Descripción                                                         |
|-----------------|---------------------------------------------------------------------|
| `RequireAuth.tsx`| Guard de rutas. Si no hay sesión activa redirige a `/login`        |

---

### 7.3 Matches (`app/src/components/matches/`)

| Componente        | Descripción                                                        |
|-------------------|--------------------------------------------------------------------|
| `MatchCard.tsx`   | Tarjeta de partido próximo o en vivo. Muestra equipos, hora, predicción guardada y botón "Predecir" |
| `ResultCard.tsx`  | Tarjeta de partido finalizado. Muestra resultado final y puntos obtenidos en la predicción |
| `PredictionForm.tsx` | Modal/formulario para ingresar el marcador predicho (home/away) y guardarlo |
| `ChampionPicker.tsx` | Selector del campeón del Mundial. Permite elegir el equipo ganador del torneo |

---

### 7.4 Sections (`app/src/components/sections/`)

Componentes de cabecera decorativa ("hero") para cada página:

| Componente          | Página           | Descripción                               |
|---------------------|------------------|-------------------------------------------|
| `HeroMatches.tsx`   | MatchesPage      | Banner superior con título y estadísticas |
| `HeroLeaderboard.tsx`| RankingPage     | Banner del ranking                        |
| `HeroParticipants.tsx`| ParticipantsPage| Banner de participantes                  |
| `HeroRaffles.tsx`   | RafflesPage      | Banner de rifas                           |
| `HeroInfo.tsx`      | InfoPage         | Banner informativo                        |
| `LeaderboardTable.tsx`| RankingPage    | Tabla visual del TOP ranking con medallas |

---

### 7.5 Admin (`app/src/components/admin/`)

| Componente        | Descripción                                                                     |
|-------------------|---------------------------------------------------------------------------------|
| `InvitationForm.tsx` | Formulario para enviar invitación por email o WhatsApp. Muestra el link generado |
| `UserTable.tsx`   | Tabla de usuarios con acciones: activar/desactivar, resetear contraseña         |
| `RaffleManager.tsx` | Panel para crear rifas, ver participantes y ejecutar sorteos                  |

---

### 7.6 Raffles (`app/src/components/raffles/`)

| Componente         | Descripción                                                      |
|--------------------|------------------------------------------------------------------|
| `RaffleCard.tsx`   | Tarjeta de rifa con info del premio, participantes y estado      |
| `RaffleJoinDialog.tsx` | Diálogo modal para confirmar participación y elegir boletas  |

---

### 7.7 UI (`app/src/components/ui/`)

| Componente    | Descripción                                          |
|---------------|------------------------------------------------------|
| `AppImage.tsx`| Componente de imagen con lazy loading y fallback     |
| `AppLogo.tsx` | Logo de la aplicación                                |
| `Icon.tsx`    | Wrapper para íconos estandarizado                    |

---

### 7.8 `FrancachelaLogo.tsx`

Componente especial con el logo y marca de agua del proyecto.  
Exporta: `FrancachelaLogo` y `FrancachelaWatermark` (decorativo para LoginPage).

---

## 8. Frontend — Hooks

Ubicados en `app/src/hooks/`. Todos usan `useState` + `useEffect` para cargar datos al montar.

| Hook                    | Datos que maneja                                            | API llamada                                     |
|-------------------------|-------------------------------------------------------------|-------------------------------------------------|
| `useAuthUser`           | `user`, `loading`, `error`                                  | `auth.getAuthMe()` (Azure SWA `/.auth/me`)     |
| `useMatches`            | `matches`, `loading`, `error`                               | `apiClient.getMatches()`                        |
| `usePredictions`        | `predictions`, `upsertPrediction()`, `loading`              | `getMyPredictions()`, `upsertPrediction()`      |
| `useRanking`            | `ranking`, `loading`, `error`                               | `apiClient.getRanking()`                        |
| `useRaffles`            | `raffles`, `join()`, `createRaffle()`, `drawRaffle()`, `loading` | Endpoints de rifas                         |
| `useAdmin`              | `users`, `invitations`, `sendInvitation()`, `resetPassword()`, `toggleActive()`, `loading`, `error` | Endpoints admin |
| `useChampionPrediction` | Estado de la predicción del campeón                        | Endpoint de predicción especial                 |

---

## 9. Frontend — Servicios y Tipos

### 9.1 `apiClient.ts` (`app/src/services/apiClient.ts`)

Cliente centralizado para todas las llamadas HTTP. **Nunca usar `fetch()` directamente en componentes o hooks.**

Base URL: `VITE_API_URL` (env) o `http://localhost:7071/api` (fallback)

```typescript
// Matches
getMatches(): Promise<Match[]>

// Predictions
upsertPrediction(body: PredictionRequest): Promise<Prediction>
getMyPredictions(): Promise<Prediction[]>
getPredictionsByMatch(matchId: string): Promise<Prediction[]>

// Ranking / Participantes
getRanking(): Promise<Score[]>
getParticipants(): Promise<Score[]>

// Rifas
getRaffles(): Promise<Raffle[]>
getRaffleById(raffleId: string): Promise<Raffle>
createRaffle(body: RaffleCreateRequest): Promise<Raffle>
joinRaffle(body: RaffleJoinRequest): Promise<Raffle>
drawRaffle(raffleId: string): Promise<Raffle>

// Admin
getUsers(): Promise<AdminUser[]>
sendInvitation(body: InvitationRequest): Promise<Invitation>
resetUserPassword(userId: string, body: ResetPasswordRequest): Promise<{ success: boolean }>
toggleUserActive(userId: string, isActive: boolean): Promise<AdminUser>
```

### 9.2 `auth.ts` (`app/src/services/auth.ts`)

Integración con Azure Static Web Apps Auth.

```typescript
getAuthMe(): Promise<AuthMe>       // Llama a /.auth/me
getLoginUrl(provider): string      // /.auth/login/{provider}
getLogoutUrl(): string             // /.auth/logout
```

En desarrollo local: si no hay `clientPrincipal`, inyecta un usuario mock (`DEV_MOCK_USER`).

---

### 9.3 Tipos TypeScript (`app/src/types/`)

#### `match.ts`
```typescript
type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED'

interface Match {
  id, tournamentId, homeTeam, awayTeam, kickoffAtUtc, stage,
  status: MatchStatus, homeScoreFinal, awayScoreFinal
}
```

#### `prediction.ts`
```typescript
interface Prediction { id, userId, matchId, home, away, pointsEarned }
interface PredictionRequest { matchId, home, away }
```

#### `ranking.ts`
```typescript
interface Score { userId, displayName, totalPoints, totalPredictions, exactScores, correctWinners, rank }
interface Participant extends Score { joinedAtUtc?, lastActiveAtUtc? }
```

#### `raffle.ts`
```typescript
type RaffleStatus = 'OPEN' | 'DRAWING' | 'COMPLETED'

interface Raffle { id, title, description, prize, status, maxParticipants, 
  participantCount, drawAtUtc, winnerId, winnerName, participants }
interface RaffleParticipant { userId, displayName, joinedAtUtc, tickets }
interface RaffleCreateRequest { title, description, prize, maxParticipants?, drawAtUtc }
interface RaffleJoinRequest { raffleId, tickets }
```

#### `admin.ts`
```typescript
interface AdminUser { userId, displayName, email, identityProvider, joinedAtUtc, 
  lastActiveAtUtc, totalPoints, totalPredictions, isActive }
interface InvitationRequest { email, displayName, message? }
interface Invitation { id, email, displayName, status, sentAtUtc, acceptedAtUtc?, invitationCode }
interface ResetPasswordRequest { userId, newPassword }
```

---

## 10. Flujo de Autenticación

### Registro (por invitación)
```
Admin crea invitación (POST /admin/invitations)
    → Se genera token AES cifrado + invitationCode
    → Se guarda InvitationEntity en BD (status: pending)
    → Se genera link: /register?token=<cifrado>&code=<código>

Admin envía link (POST /notifications/send)
    → Por email (SendGrid) o WhatsApp (Twilio)

Usuario abre link en navegador
    → Frontend llama GET /auth/validate-invitation?token=...
    → Backend descifra token, verifica expiración, verifica status en BD
    → Devuelve { valid: true, email }

Usuario completa formulario de registro (nombre + contraseña)
    → Frontend llama POST /auth/register
    → Backend crea UserEntity con passwordHash BCrypt
    → Marca invitación como "used"
    → Devuelve JWT + perfil
```

### Login
```
Usuario ingresa email + contraseña (POST /auth/login)
    → Backend busca usuario por email
    → Verifica status "active"
    → Verifica contraseña con BCrypt.Verify()
    → Genera JWT (HS256, claims: sub, email, role)
    → Devuelve { token, userId, email, user }
```

### Acceso protegido (admin)
```
Request con Authorization: Bearer <JWT>
    → SecureTokenService.ValidateAdminToken(token)
    → JwtService.ValidateToken() — valida firma, expiración, issuer, audience
    → Extrae userId del claim 'sub'
    → Consulta user en BD
    → Verifica que role == "admin" en BD (no solo en el token)
    → Previene escalada de privilegios si el rol cambió
```

---

## 11. Sistema de Puntuación

Implementado en `api/Services/ScoringService.cs` → `CalculatePoints()`:

| Resultado                        | Puntos |
|----------------------------------|--------|
| Marcador exacto (ej: 2-1 = 2-1) | **3**  |
| Ganador correcto o empate correcto | **1** |
| Predicción incorrecta            | **0**  |

**Regla de cierre:** Las predicciones se cierran **1 minuto antes** del inicio del partido (`KickoffAtUtc - 1 min`). Una vez cerrado, no se puede crear ni actualizar la predicción.

**Desempate en ranking:**
1. Mayor cantidad de marcadores exactos
2. Mayor cantidad de ganadores/empates correctos
3. Orden alfabético

---

## 12. Variables de Entorno

### Backend (`api/local.settings.json`)
```json
{
  "Values": {
    "SqlConnectionString": "Server=...;Database=WorldCup2026;...",
    "Jwt:SecretKey": "<min 32 caracteres>",
    "Jwt:Issuer": "worldcup2026-api",
    "Jwt:Audience": "worldcup2026-app",
    "Jwt:ExpirationMinutes": "60",
    "App:BaseUrl": "http://localhost:3000",
    "FootballData:ApiKey": "<token de football-data.org>",
    "SendGrid:ApiKey": "<sendgrid key>",
    "Twilio:AccountSid": "<sid>",
    "Twilio:AuthToken": "<token>",
    "Twilio:WhatsAppFrom": "whatsapp:+14155238886"
  }
}
```
> ⚠️ Este archivo está en `.gitignore`. Nunca subir credenciales reales.

### Frontend (`app/.env.local`)
```
VITE_API_URL=http://localhost:7071/api
```

---

## 13. Comandos de Desarrollo

### Frontend
```powershell
cd app
npm install
npm run dev          # Servidor de desarrollo en http://localhost:5173
npm run build        # Build de producción
npm run preview      # Previsualizar build
```

### Backend
```powershell
cd api
dotnet restore
func start           # Azure Functions en http://localhost:7071

# Migraciones EF Core
dotnet ef migrations add <NombreMigracion>
dotnet ef database update
```

### Solución completa
```powershell
# Terminal 1 — Frontend
cd app ; npm run dev

# Terminal 2 — Backend
cd api ; func start
```

---

*Documentación generada automáticamente para el proyecto Francachela Mundial 2026.*
