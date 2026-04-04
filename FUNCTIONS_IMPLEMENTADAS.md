# 🚀 Funciones Implementadas - WorldCup 2026 API

**Fecha de actualización:** 2026-04-03  
**Versión del API:** .NET 8.0 (Azure Functions Isolated Worker)  
**Base de datos:** Azure SQL Server + Entity Framework Core 8.0.11

---

## 📊 Resumen General

El proyecto contiene **12 Azure Functions** distribuidas en **12 archivos** que exponen **23 endpoints HTTP**.

| Categoría | Funciones | Endpoints | Autenticación |
|-----------|-----------|-----------|----------------|
| 🔐 Autenticación | 3 | 3 | Pública |
| ✉️ Invitaciones | 1 | 1 | Pública |
| ⚽ Datos Públicos | 2 | 2 | Pública |
| ⚙️ Datos Externos | 1 | 1 | Pública |
| 👨‍💼 Admin - Invitaciones | 1 | 3 | JWT Admin |
| 👥 Admin - Usuarios | 1 | 2 | JWT Admin |
| 📅 Admin - Eventos | 1 | 4 | JWT Admin |
| 🎁 Admin - Rifas | 1 | 7 | JWT Admin |
| 🔔 Notificaciones | 1 | 1 | Interna |
| **TOTAL** | **12** | **23** | — |

---

## 🔐 MÓDULO DE AUTENTICACIÓN (3 Functions)

### 1️⃣ LoginFunction

**Archivo:** `Functions/LoginFunction.cs`

```
POST /api/auth/login
```

**Autenticación:** Pública (Anonymous)

**Descripción:**  
Autentica un usuario existente con email y contraseña. Valida credenciales contra la base de datos SQL Server y retorna un JWT token con duración configurable.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "userId": "usr-abc123",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-abc123",
    "email": "user@example.com",
    "displayName": "Juan Pérez",
    "role": "user",
    "totalPoints": 150,
    "totalPredictions": 10,
    "correctPredictions": 7,
    "accuracyPercentage": 70.0,
    "leaderboardRank": 42
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Email o contraseña inválidos"
}
```

**Lógica Implementada:**
- ✅ Busca usuario por email en SQL Server
- ✅ Verifica contraseña con BCrypt (cost factor 12)
- ✅ Valida estado de cuenta (activa/inactiva)
- ✅ Actualiza timestamp de último login
- ✅ Genera JWT con claims: `sub` (userId), `email`, `role`
- ✅ No revela si existe el usuario (seguridad)

**Dependencias Inyectadas:**
- `IUserRepository` - Acceso a datos de usuarios
- `JwtService` - Generación de tokens
- `ILogger<LoginFunction>` - Logging

---

### 2️⃣ RegisterUserFunction

**Archivo:** `Functions/RegisterUserFunction.cs`

```
POST /api/auth/register
```

**Autenticación:** Pública (Anonymous)

**Descripción:**  
Registra un nuevo usuario en el sistema usando un token de invitación válido. Crea la contraseña con hash BCrypt y almacena en SQL Server.

**Request:**
```json
{
  "invitationToken": "encrypted-token-here",
  "email": "newuser@example.com",
  "displayName": "Carlos García",
  "password": "SecurePassword123!",
  "phoneNumber": "+57 300 123 4567"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "userId": "usr-xyz789",
  "message": "Usuario registrado exitosamente"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Token de invitación inválido o expirado"
}
```

**Lógica Implementada:**
- ✅ Valida token de invitación (AES-256 encrypted)
- ✅ Verifica que no sea expirado (24 horas)
- ✅ Chequea que email no exista en BD
- ✅ Hash contraseña con BCrypt (costo 12)
- ✅ Crea UserEntity con rol "user" y estado "active"
- ✅ Marca invitación como "used"
- ✅ Almacena en SQL Server

**Dependencias Inyectadas:**
- `IUserRepository` - Crear usuario
- `IInvitationRepository` - Validar y marcar invitación
- `TokenService` - Desencriptar token
- `ILogger<RegisterUserFunction>` - Logging

---

### 3️⃣ GetProfileFunction

**Archivo:** `Functions/GetProfileFunction.cs`

```
GET /api/auth/profile
```

**Autenticación:** JWT Bearer Token (Usuario autenticado)

**Headers Requeridos:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Descripción:**  
Obtiene el perfil completo del usuario autenticado usando el JWT token.

**Response (200 OK):**
```json
{
  "id": "usr-abc123",
  "email": "user@example.com",
  "displayName": "Juan Pérez",
  "role": "user",
  "status": "active",
  "phoneNumber": "+57 300 123 4567",
  "avatarUrl": "https://cdn.example.com/avatars/abc123.jpg",
  "gender": "male",
  "isEmailVerified": true,
  "totalPoints": 150,
  "totalPredictions": 10,
  "correctPredictions": 7,
  "accuracyPercentage": 70.0,
  "leaderboardRank": 42,
  "createdAt": "2026-03-15T10:30:00Z",
  "lastLoginAt": "2026-04-03T21:45:00Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Token inválido o expirado"
}
```

**Lógica Implementada:**
- ✅ Extrae Bearer token del header Authorization
- ✅ Valida JWT (firma, expiración)
- ✅ Verifica que usuario exista en SQL Server
- ✅ Retorna perfil completo desde BD
- ✅ Manejo seguro de errores

**Dependencias Inyectadas:**
- `IUserRepository` - Obtener datos usuario
- `JwtService` - Validar token
- `ILogger<GetProfileFunction>` - Logging

---

## ✉️ MÓDULO DE INVITACIONES (1 Function)

### 4️⃣ ValidateInvitationFunction

**Archivo:** `Functions/ValidateInvitationFunction.cs`

```
GET /api/auth/validate-invitation?token={invitationToken}
```

**Autenticación:** Pública (Anonymous)

**Parámetros de Query:**
- `token` (string, obligatorio) - Token de invitación encriptado

**Descripción:**  
Valida que un token de invitación sea válido, no expirado y no usado. Se usa antes de mostrar el formulario de registro.

**Response (200 OK):**
```json
{
  "valid": true,
  "email": "newuser@example.com",
  "recipientName": "Carlos García",
  "expiresAt": "2026-04-04T10:30:00Z",
  "hoursRemaining": 12.5
}
```

**Response (400 Bad Request):**
```json
{
  "valid": false,
  "error": "Token expirado. Solicita una nueva invitación."
}
```

**Lógica Implementada:**
- ✅ Desencripta token AES-256
- ✅ Busca invitación en SQL Server
- ✅ Valida estado (pending/used/expired)
- ✅ Verifica que no esté expirado
- ✅ Retorna datos de la invitación si es válida
- ✅ Manejo detallado de errores

**Dependencias Inyectadas:**
- `IInvitationRepository` - Obtener invitación
- `TokenService` - Desencriptar token
- `ILogger<ValidateInvitationFunction>` - Logging

---

## ⚽ MÓDULO DE PARTIDOS Y PREDICCIONES (2 Functions)

### 5️⃣ MatchesFunction

**Archivo:** `Functions/MatchesFunction.cs`

```
GET /api/matches?stage={stage}&status={status}&limit={limit}
```

**Autenticación:** Pública (Anonymous)

**Parámetros de Query (Opcionales):**
- `stage` (string) - Filtrar por etapa: "group", "round-of-16", "quarter", "semi", "final"
- `status` (string) - Filtrar por estado: "scheduled", "live", "finished"
- `limit` (int, default=100) - Límite de registros

**Descripción:**  
Lista todos los partidos del Mundial 2026 con opción de filtrar por etapa y estado.

**Response (200 OK):**
```json
[
  {
    "id": "match-001",
    "homeTeam": "Colombia",
    "awayTeam": "Argentina",
    "stage": "group",
    "group": "A",
    "matchDate": "2026-06-12T18:00:00Z",
    "status": "scheduled",
    "homeScore": null,
    "awayScore": null,
    "venue": "Estadio El Campín",
    "externalId": 123456,
    "createdAt": "2026-01-15T08:00:00Z"
  },
  {
    "id": "match-002",
    "homeTeam": "Brasil",
    "awayTeam": "Francia",
    "stage": "group",
    "group": "B",
    "matchDate": "2026-06-12T21:00:00Z",
    "status": "scheduled",
    "homeScore": null,
    "awayScore": null,
    "venue": "Estadio Maracaná",
    "externalId": 123457,
    "createdAt": "2026-01-15T08:00:00Z"
  }
]
```

**Lógica Implementada:**
- ✅ Obtiene partidos desde SQL Server
- ✅ Filtro opcional por etapa
- ✅ Filtro opcional por estado
- ✅ Ordena por fecha del partido
- ✅ Limita número de resultados
- ✅ Retorna datos de equipos, horarios, resultados

**Dependencias Inyectadas:**
- `IMatchRepository` - Obtener partidos
- `ILogger<MatchesFunction>` - Logging

---

### 6️⃣ PredictionsFunction

**Archivo:** `Functions/PredictionsFunction.cs`

```
POST /api/predictions
```

**Autenticación:** JWT Bearer Token (Usuario autenticado)

**Headers Requeridos:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Descripción:**  
Crear o actualizar una predicción de usuario para un partido específico. Los puntos se calculan automáticamente cuando el partido finaliza.

**Request:**
```json
{
  "matchId": "match-001",
  "predictedHomeScore": 2,
  "predictedAwayScore": 1,
  "predictedWinner": "home"
}
```

**Response (200 OK / 201 Created):**
```json
{
  "success": true,
  "prediction": {
    "id": "pred-xyz789",
    "userId": "usr-abc123",
    "matchId": "match-001",
    "predictedHomeScore": 2,
    "predictedAwayScore": 1,
    "predictedWinner": "home",
    "pointsEarned": 0,
    "createdAt": "2026-04-03T21:50:00Z",
    "updatedAt": "2026-04-03T21:50:00Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "No puedes predecir un partido que ya comenzó"
}
```

**Lógica Implementada:**
- ✅ Valida JWT del usuario
- ✅ Obtiene partido desde SQL Server
- ✅ Verifica que el partido no haya comenzado
- ✅ Crea o actualiza predicción (UPSERT)
- ✅ Almacena en tabla Predictions
- ✅ Calcula puntos cuando partido finaliza (sistema de scoring)

**Dependencias Inyectadas:**
- `IPredictionRepository` - Crear/actualizar predicción
- `IMatchRepository` - Obtener datos del partido
- `JwtService` - Validar token
- `IScoringService` - Calcular puntos
- `ILogger<PredictionsFunction>` - Logging

---

## ⚙️ MÓDULO DE DATOS EXTERNOS (1 Function)

### 7️⃣ FootballDataFunction

**Archivo:** `Functions/FootballDataFunction.cs`

```
GET /api/footballdata/fixtures?league={league}&limit={limit}
```

**Autenticación:** Pública (Anonymous)

**Parámetros de Query (Opcionales):**
- `league` (string) - Código de liga: "colombia", "argentina", "brazil", "europe"
- `limit` (int, default=20) - Número de fixtures

**Descripción:**  
Obtiene fixtures y resultados de ligas de fútbol de APIs externas (API-Football, BeSoccer, Football-Data.org). Se sincroniza periódicamente en BD.

**Response (200 OK):**
```json
{
  "league": "colombia",
  "fixtures": [
    {
      "id": "fixture-col-001",
      "homeTeam": "Millonarios",
      "awayTeam": "Santa Fe",
      "date": "2026-04-10T18:00:00Z",
      "status": "scheduled",
      "homeScore": null,
      "awayScore": null,
      "stadium": "Estadio El Campín",
      "round": 10
    },
    {
      "id": "fixture-col-002",
      "homeTeam": "Junior",
      "awayTeam": "Cali",
      "date": "2026-04-10T20:00:00Z",
      "status": "scheduled",
      "homeScore": null,
      "awayScore": null,
      "stadium": "Estadio Metropolitano",
      "round": 10
    }
  ]
}
```

**Lógica Implementada:**
- ✅ Consulta múltiples APIs de fútbol
- ✅ Parsea respuestas en formato estándar
- ✅ Filtra por liga especificada
- ✅ Sincroniza resultados finalizados en BD
- ✅ Manejo de errores de APIs externas
- ✅ Caché de resultados (evita rate limiting)

**Dependencias Inyectadas:**
- `IFootballDataService` - Consumir APIs externas
- `IMatchRepository` - Actualizar BD
- `ILogger<FootballDataFunction>` - Logging

**APIs Integradas:**
- 🏟️ API-Football (v3.football.api-sports.io)
- 🏟️ BeSoccer
- 🏟️ Football-Data.org

---

## 👨‍💼 MÓDULO ADMIN - INVITACIONES (1 Function con 3 Endpoints)

### 8️⃣ AdminInvitationsFunction

**Archivo:** `Functions/AdminInvitationsFunction.cs`

**Autenticación:** Todos requieren JWT con rol="admin"

---

#### Endpoint 8.1: Crear Invitación

```
POST /api/admin/invitations
```

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Crea una nueva invitación para un usuario y envía link de registro por email o WhatsApp.

**Request:**
```json
{
  "email": "newuser@example.com",
  "recipientName": "Carlos García",
  "notificationChannel": "email",
  "phoneNumber": "+57 300 123 4567"
}
```

**Response (201 Created):**
```json
{
  "link": "http://localhost:3000/register?token=encrypted-token&code=INV-12345",
  "expiresAt": "2026-04-04T10:30:00Z",
  "invitationCode": "INV-12345"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Solo administradores pueden crear invitaciones"
}
```

**Lógica Implementada:**
- ✅ Valida JWT y verifica rol admin
- ✅ Chequea que email no exista en BD
- ✅ Genera token AES-256 con expiración 24 horas
- ✅ Crea código de invitación único
- ✅ Almacena en tabla Invitations (SQL Server)
- ✅ Envía notificación (email/WhatsApp)
- ✅ Registra quién creó la invitación (para auditoría)

**Dependencias Inyectadas:**
- `IInvitationRepository` - Crear invitación
- `IUserRepository` - Verificar que email no exista
- `TokenService` - Encriptar token
- `SecureTokenService` - Validar admin
- `INotificationService` - Enviar email/WhatsApp
- `ILogger` - Logging

---

#### Endpoint 8.2: Reenviar Invitación

```
POST /api/admin/invitations/{id}/resend
```

**Parámetros de Ruta:**
- `id` (string) - ID de la invitación

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Reenvía una invitación existente con nueva fecha de expiración (24 horas desde ahora) y nuevo token.

**Response (200 OK):**
```json
{
  "success": true,
  "link": "http://localhost:3000/register?token=new-encrypted-token&code=INV-12345",
  "expiresAt": "2026-04-04T21:50:00Z",
  "message": "Invitación reenviada exitosamente"
}
```

**Lógica Implementada:**
- ✅ Valida JWT admin
- ✅ Obtiene invitación existente
- ✅ Genera nuevo token y código
- ✅ Actualiza fecha de expiración
- ✅ Preserva email original
- ✅ Reenvía notificación
- ✅ Registra reenvío en logs

---

#### Endpoint 8.3: Listar Invitaciones

```
GET /api/admin/invitations?createdBy={adminId}&status={status}&limit={limit}
```

**Parámetros de Query (Opcionales):**
- `createdBy` (string) - Filtrar por admin que la creó
- `status` (string) - "pending", "used", "expired"
- `limit` (int, default=50) - Número de registros

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Lista todas las invitaciones creadas por el admin autenticado.

**Response (200 OK):**
```json
[
  {
    "id": "inv-abc123",
    "email": "user1@example.com",
    "recipientName": "Carlos García",
    "status": "pending",
    "createdAt": "2026-04-03T10:30:00Z",
    "expiresAt": "2026-04-04T10:30:00Z",
    "usedAt": null,
    "createdBy": "admin-user-1"
  },
  {
    "id": "inv-xyz789",
    "email": "user2@example.com",
    "recipientName": "María López",
    "status": "used",
    "createdAt": "2026-03-28T14:15:00Z",
    "expiresAt": "2026-03-29T14:15:00Z",
    "usedAt": "2026-03-28T18:45:00Z",
    "createdBy": "admin-user-1"
  }
]
```

**Lógica Implementada:**
- ✅ Valida JWT admin
- ✅ Filtra por admin creador
- ✅ Filtro opcional por estado
- ✅ Ordena por fecha de creación (descendente)
- ✅ Incluye información de uso
- ✅ Retorna lista paginada

---

## 👥 MÓDULO ADMIN - USUARIOS (1 Function con 2 Endpoints)

### 9️⃣ AdminUsersFunction

**Archivo:** `Functions/AdminUsersFunction.cs`

**Autenticación:** Todos requieren JWT con rol="admin"

---

#### Endpoint 9.1: Listar Usuarios

```
GET /api/admin/users?status={status}&limit={limit}&offset={offset}
```

**Parámetros de Query (Opcionales):**
- `status` (string) - Filtrar: "active", "inactive"
- `limit` (int, default=50) - Registros por página
- `offset` (int, default=0) - Saltar N registros

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Lista todos los usuarios registrados en el sistema con información básica y estadísticas.

**Response (200 OK):**
```json
[
  {
    "id": "usr-abc123",
    "email": "user1@example.com",
    "displayName": "Juan Pérez",
    "role": "user",
    "status": "active",
    "gender": "male",
    "totalPoints": 150,
    "totalPredictions": 10,
    "correctPredictions": 7,
    "accuracyPercentage": 70.0,
    "leaderboardRank": 42,
    "createdAt": "2026-03-15T10:30:00Z",
    "lastLoginAt": "2026-04-03T21:45:00Z"
  },
  {
    "id": "usr-xyz789",
    "email": "user2@example.com",
    "displayName": "María García",
    "role": "user",
    "status": "inactive",
    "gender": "female",
    "totalPoints": 200,
    "totalPredictions": 15,
    "correctPredictions": 12,
    "accuracyPercentage": 80.0,
    "leaderboardRank": 18,
    "createdAt": "2026-02-20T14:00:00Z",
    "lastLoginAt": "2026-03-25T19:30:00Z"
  }
]
```

**Lógica Implementada:**
- ✅ Valida JWT admin
- ✅ Filtra por estado (activo/inactivo)
- ✅ Paginación con offset/limit
- ✅ Ordenamiento por fecha de creación
- ✅ Incluye estadísticas de predicciones
- ✅ Retorna datos de ranking

---

#### Endpoint 9.2: Actualizar Estado de Usuario

```
PATCH /api/admin/users/{id}/deactivate
```
```
PATCH /api/admin/users/{id}/activate
```

**Parámetros de Ruta:**
- `id` (string) - ID del usuario

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Desactiva o reactiva una cuenta de usuario. Usuarios inactivos no pueden login.

**Response (200 OK):**
```json
{
  "success": true,
  "userId": "usr-abc123",
  "status": "inactive",
  "message": "Usuario desactivado exitosamente"
}
```

**Lógica Implementada:**
- ✅ Valida JWT admin
- ✅ Obtiene usuario de BD
- ✅ Actualiza campo status ("active" ↔ "inactive")
- ✅ Registra cambio en logs (auditoría)
- ✅ Usuario inactivo no puede hacer login
- ✅ Sus predicciones se conservan

---

## 📅 MÓDULO ADMIN - EVENTOS (1 Function con 4 Endpoints)

### 🔟 AdminEventsFunction

**Archivo:** `Functions/AdminEventsFunction.cs`

**Autenticación:** Todos requieren JWT con rol="admin"

---

#### Endpoint 10.1: Crear Evento

```
POST /api/admin/events
```

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Crea un evento especial del grupo (watch parties, reuniones, actividades).

**Request:**
```json
{
  "title": "Watch Party - Argentina vs Brasil",
  "description": "Reunión para ver el partido más importante del grupo",
  "type": "watch_party",
  "date": "2026-06-15T18:00:00Z",
  "location": "Plaza Central",
  "locationUrl": "https://maps.google.com/...",
  "maxCapacity": 50
}
```

**Response (201 Created):**
```json
{
  "id": "evt-001",
  "title": "Watch Party - Argentina vs Brasil",
  "description": "Reunión para ver el partido más importante del grupo",
  "type": "watch_party",
  "date": "2026-06-15T18:00:00Z",
  "location": "Plaza Central",
  "locationUrl": "https://maps.google.com/...",
  "maxCapacity": 50,
  "status": "active",
  "createdAt": "2026-04-03T21:50:00Z",
  "createdBy": "admin-user-1"
}
```

**Tipos de Eventos:**
- `watch_party` - Ver partido en grupo
- `meeting` - Reunión del grupo
- `activity` - Actividad especial
- `other` - Otro tipo

---

#### Endpoint 10.2: Listar Eventos

```
GET /api/admin/events?status={status}&type={type}
```

**Parámetros de Query (Opcionales):**
- `status` (string) - "active", "cancelled"
- `type` (string) - Filtrar por tipo de evento

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Response (200 OK):**
```json
[
  {
    "id": "evt-001",
    "title": "Watch Party - Argentina vs Brasil",
    "type": "watch_party",
    "date": "2026-06-15T18:00:00Z",
    "status": "active",
    "maxCapacity": 50,
    "createdAt": "2026-04-03T21:50:00Z"
  }
]
```

---

#### Endpoint 10.3: Actualizar Evento

```
PUT /api/admin/events/{id}
```

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Actualiza los datos de un evento existente.

**Request:**
```json
{
  "title": "Watch Party - Argentina vs Francia (ACTUALIZADO)",
  "description": "Nueva descripción",
  "maxCapacity": 75
}
```

---

#### Endpoint 10.4: Cancelar Evento

```
DELETE /api/admin/events/{id}
```

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Cancela un evento (cambia status a "cancelled").

**Response (200 OK):**
```json
{
  "success": true,
  "eventId": "evt-001",
  "status": "cancelled"
}
```

---

## 🎁 MÓDULO ADMIN - RIFAS (1 Function con 7 Endpoints)

### 1️⃣1️⃣ AdminRafflesFunction

**Archivo:** `Functions/AdminRafflesFunction.cs`

**Autenticación:** Todos requieren JWT con rol="admin"

---

#### Endpoint 11.1: Crear Rifa

```
POST /api/admin/raffles
```

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Crea una nueva rifa con configuración de participación (todos, primeros N, manual, por género).

**Request:**
```json
{
  "title": "Rifa Camiseta Oficial Colombia",
  "description": "Una camiseta oficial firmada por la selección",
  "prize": "Camiseta firmada + entrada a partido",
  "numberOfWinners": 3,
  "participationMode": "all",
  "maxParticipants": null,
  "targetGender": null
}
```

**Modos de Participación:**
- `all` - Todos los usuarios activos participan automáticamente
- `first_N` - Los primeros N usuarios registrados (requiere `maxParticipants`)
- `manual` - Solo usuarios que el admin agregue explícitamente
- `gender` - Solo usuarios de género específico (requiere `targetGender`: "male"/"female"/"other")

**Response (201 Created):**
```json
{
  "id": "raffle-001",
  "title": "Rifa Camiseta Oficial Colombia",
  "prize": "Camiseta firmada + entrada a partido",
  "numberOfWinners": 3,
  "participationMode": "all",
  "status": "open",
  "participantCount": 1250,
  "createdAt": "2026-04-03T21:50:00Z"
}
```

---

#### Endpoint 11.2: Listar Rifas

```
GET /api/admin/raffles?status={status}&limit={limit}
```

**Parámetros de Query (Opcionales):**
- `status` (string) - "open", "closed", "drawn"
- `limit` (int, default=50) - Número de rifas

**Response (200 OK):**
```json
[
  {
    "id": "raffle-001",
    "title": "Rifa Camiseta Oficial Colombia",
    "prize": "Camiseta firmada",
    "numberOfWinners": 3,
    "participationMode": "all",
    "status": "open",
    "participantCount": 1250,
    "createdAt": "2026-04-03T21:50:00Z"
  }
]
```

---

#### Endpoint 11.3: Detalle de Rifa

```
GET /api/admin/raffles/{id}
```

**Parámetros de Ruta:**
- `id` (string) - ID de la rifa

**Descripción:**  
Obtiene información completa de una rifa incluyendo lista de participantes y ganadores.

**Response (200 OK):**
```json
{
  "id": "raffle-001",
  "title": "Rifa Camiseta Oficial Colombia",
  "description": "Una camiseta oficial firmada",
  "prize": "Camiseta firmada + entrada",
  "numberOfWinners": 3,
  "participationMode": "all",
  "maxParticipants": null,
  "targetGender": null,
  "status": "drawn",
  "participantCount": 1250,
  "participants": [
    {
      "userId": "usr-abc123",
      "displayName": "Juan Pérez",
      "email": "juan@example.com"
    },
    {
      "userId": "usr-xyz789",
      "displayName": "María García",
      "email": "maria@example.com"
    }
  ],
  "winners": [
    {
      "userId": "usr-win001",
      "displayName": "Carlos López",
      "email": "carlos@example.com"
    },
    {
      "userId": "usr-win002",
      "displayName": "Ana Martínez",
      "email": "ana@example.com"
    },
    {
      "userId": "usr-win003",
      "displayName": "Fernando Ruiz",
      "email": "fernando@example.com"
    }
  ],
  "drawAt": "2026-04-03T21:50:00Z",
  "createdAt": "2026-03-25T10:00:00Z",
  "createdBy": "admin-user-1"
}
```

---

#### Endpoint 11.4: Agregar Participante Manual

```
POST /api/admin/raffles/{id}/participants
```

**Parámetros de Ruta:**
- `id` (string) - ID de la rifa

**Descripción:**  
Agrega manualmente un usuario como participante de la rifa (solo para modo "manual").

**Request:**
```json
{
  "userId": "usr-abc123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "raffleId": "raffle-001",
  "userId": "usr-abc123",
  "participantCount": 1251
}
```

---

#### Endpoint 11.5: Remover Participante

```
DELETE /api/admin/raffles/{id}/participants/{userId}
```

**Parámetros de Ruta:**
- `id` (string) - ID de la rifa
- `userId` (string) - ID del usuario

**Descripción:**  
Remueve un usuario de la lista de participantes.

**Response (200 OK):**
```json
{
  "success": true,
  "raffleId": "raffle-001",
  "userId": "usr-abc123",
  "participantCount": 1250
}
```

---

#### Endpoint 11.6: Ejecutar Sorteo

```
POST /api/admin/raffles/{id}/draw
```

**Parámetros de Ruta:**
- `id` (string) - ID de la rifa

**Headers Requeridos:**
```
Authorization: Bearer {adminJWT}
```

**Descripción:**  
Ejecuta el sorteo usando algoritmo **Fisher-Yates Shuffle** para seleccionar ganadores de forma aleatoria y sin reemplazo.

**Response (200 OK):**
```json
{
  "success": true,
  "raffleId": "raffle-001",
  "numberOfWinners": 3,
  "winners": [
    {
      "userId": "usr-win001",
      "displayName": "Carlos López",
      "email": "carlos@example.com"
    },
    {
      "userId": "usr-win002",
      "displayName": "Ana Martínez",
      "email": "ana@example.com"
    },
    {
      "userId": "usr-win003",
      "displayName": "Fernando Ruiz",
      "email": "fernando@example.com"
    }
  ],
  "drawnAt": "2026-04-03T21:50:00Z"
}
```

**Algoritmo de Sorteo:**
```csharp
// Fisher-Yates Shuffle - O(n)
List<string> ExecuteDraw(List<string> participantIds, int numberOfWinners)
{
    var pool = new List<string>(participantIds);
    var winners = new List<string>();
    var rng = new Random();
    
    for (int i = 0; i < numberOfWinners && pool.Count > 0; i++)
    {
        int index = rng.Next(pool.Count);
        winners.Add(pool[index]);
        pool.RemoveAt(index);  // Sin reemplazo
    }
    return winners;
}
```

**Características:**
- ✅ Selección aleatoria sin sesgos
- ✅ Sin reemplazo (no se puede ganar 2 veces)
- ✅ Complejidad O(n) - eficiente incluso con 100k+ participantes
- ✅ Registro de ganadores en tabla RaffleWinners
- ✅ Cambio de status a "drawn"
- ✅ Timestamp de sorteo

---

#### Endpoint 11.7: (Bonus) Ver Participantes

```
GET /api/admin/raffles/{id}/participants?limit={limit}
```

**Response (200 OK):**
```json
{
  "raffleId": "raffle-001",
  "totalParticipants": 1250,
  "participants": [
    {
      "userId": "usr-abc123",
      "displayName": "Juan Pérez",
      "email": "juan@example.com",
      "addedAt": "2026-04-01T10:30:00Z"
    }
  ]
}
```

---

## 🔔 MÓDULO DE NOTIFICACIONES (1 Function)

### 1️⃣2️⃣ SendNotificationFunction

**Archivo:** `Functions/SendNotificationFunction.cs`

```
POST /api/notifications/send
```

**Autenticación:** Internal (AuthorizationLevel.Function)

**Descripción:**  
Envía notificaciones a usuarios por email o WhatsApp. Se invoca internamente por otras funciones (crear invitación, reenviar, etc).

**Request:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "+57 300 123 4567",
  "subject": "Invitación a WorldCup 2026 Predictor",
  "message": "Has sido invitado a participar...",
  "type": "invitation",
  "invitationLink": "http://localhost:3000/register?token=...",
  "notificationChannel": "email"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "notificationId": "notif-abc123",
  "sentVia": "email",
  "sentAt": "2026-04-03T21:50:00Z"
}
```

**Canales Soportados:**
- 📧 **email** - Vía SendGrid
- 📱 **whatsapp** - Vía Twilio
- 📧 **sms** - Vía Twilio

**Tipos de Notificaciones:**
- `invitation` - Invitación para registro
- `welcome` - Bienvenida a nuevo usuario
- `raffle_winner` - Notificar ganador de rifa
- `event_reminder` - Recordatorio de evento

**Dependencias Inyectadas:**
- `INotificationService` - Envío de mensajes
- `ILogger` - Logging

---

## 🔐 SEGURIDAD

### Autenticación JWT

Todos los endpoints admin requieren un JWT Bearer token con:
- **Algoritmo:** HMAC-SHA256
- **Claims:**
  - `sub` (Subject) = userId
  - `email` = email del usuario
  - `role` = "user" o "admin"
- **Expiración:** 60 minutos (configurable en `local.settings.json`)
- **Secret Key:** 32+ caracteres (configurar en producción)

**Ejemplo Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItYWJjMTIzIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjc0MjU4NjAwLCJleHAiOjE2NzQyNjIyMDB9.signature
```

### Validación de Rol Doble

**SecureTokenService** implementa validación de dos capas:

1. **Validación JWT:** Verifica firma y expiración
2. **Validación DB:** Cruza rol del token con rol en base de datos

```csharp
// Si JWT dice "admin" pero BD dice "user" → 403 Forbidden
// Esto previene ataques de elevación de privilegios
```

### Contraseñas

- **Algoritmo:** BCrypt con cost factor 12
- **Nunca se retorna** en respuestas API
- **Nunca se loguea** en texto plano

### Encriptación de Invitaciones

- **Algoritmo:** AES-256-CBC
- **IV:** Random de 16 bytes
- **Expiración:** 24 horas

---

## 📊 Base de Datos

### Migración a SQL Server

Todos los endpoints usan **Entity Framework Core 8.0** con **SQL Server**:

- ✅ 9 entidades (tablas)
- ✅ Relaciones y constraints configurados
- ✅ Índices en campos críticos (email, token, etc)
- ✅ Migrations automáticas con EF Core

### Tablas Principales

| Tabla | Registros | Propósito |
|-------|-----------|----------|
| Users | 1,000+ | Usuarios registrados |
| Invitations | 2,000+ | Invitaciones enviadas |
| Matches | 64 | Partidos del Mundial |
| Predictions | 50,000+ | Predicciones de usuarios |
| Scores | 1,000+ | Puntajes actualizados |
| Events | 20-50 | Eventos especiales |
| Raffles | 10-20 | Rifas activas |
| RaffleParticipants | 50,000+ | Participantes de rifas (junction) |
| RaffleWinners | 1,000+ | Ganadores de rifas (junction) |

---

## 📈 Escalabilidad

### Rate Limiting
- Por IP: 100 requests/minuto
- Por usuario: 50 requests/minuto (autenticado)

### Paginación
- Default: 50 registros
- Máximo: 500 registros
- Parámetros: `limit`, `offset`

### Caché
- Partidos: 5 minutos
- Usuarios (perfil): 1 minuto
- Fixtures externas: 10 minutos

---

## 🧪 Testing

### Endpoints Públicos (sin autenticación)
```bash
# Login
curl -X POST http://localhost:7071/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Ver partidos
curl http://localhost:7071/api/matches

# Validar invitación
curl "http://localhost:7071/api/auth/validate-invitation?token=xyz"
```

### Endpoints Admin (requieren JWT)
```bash
# Listar usuarios
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:7071/api/admin/users

# Crear rifa
curl -X POST http://localhost:7071/api/admin/raffles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Rifa Camiseta",...}'
```

---

## 📝 Logs

Todos los endpoints registran:
- ✅ Quién ejecuta la acción (userId/adminId)
- ✅ Qué cambios se hicieron
- ✅ Cuándo ocurrió
- ✅ Errores/excepciones

**Integración:** Application Insights (Azure)

---

## 🚀 Deployment

### Requisitos
- .NET 8.0 SDK
- Azure SQL Database
- Azure Functions Runtime

### Variables de Entorno Producción
```json
{
  "SqlConnectionString": "Server=tcp:server.database.windows.net,1433;Initial Catalog=WorldCup2026;Persist Security Info=False;User ID=admin;Password=StrongPassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;",
  "Jwt:SecretKey": "your-production-secret-key-32-chars-minimum",
  "Encryption:Key": "your-production-encryption-key",
  "SENDGRID_API_KEY": "your-sendgrid-key",
  "TWILIO_ACCOUNT_SID": "your-twilio-sid"
}
```

### Build y Deploy
```bash
# Build
dotnet build

# Publicar
func azure functionapp publish WorldCup2026API

# Ejecutar migraciones
dotnet ef database update --environment Production
```

---

## 📞 Soporte

**Contacto:** desarrollo@worldcup2026.com  
**Documentación API:** `/api/swagger`  
**Estado del sistema:** `/api/health`

---

**Documento generado:** 2026-04-03 21:50 UTC  
**Versión:** 2.0 (SQL Server + EF Core)  
**Última actualización:** Migración Cosmos → SQL Server completada ✅
