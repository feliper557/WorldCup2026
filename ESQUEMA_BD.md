# 🗄️ Esquema de Base de Datos - WorldCup 2026

## Información General

**Base de Datos:** Azure Cosmos DB  
**Modelo:** NoSQL (Documentos JSON)  
**Contenedor único:** `users` (con múltiples partition keys)  
**Contenedores separados:** `matches`, `predictions`, `scores`

---

## 📊 Estructura General

```
worldcup-db (Database)
├── users (Container - Multi-purpose)
│   ├── Documentos con partitionKey = "users"     → UserDocument
│   ├── Documentos con partitionKey = "invitations" → InvitationDocument
│   ├── Documentos con partitionKey = "events"    → EventDocument
│   └── Documentos con partitionKey = "raffles"   → RaffleDocument
├── matches (Container)
│   └── Documentos → Match
├── predictions (Container)
│   └── Documentos → Prediction
└── scores (Container)
    └── Documentos → Score
```

---

## 📄 Documentos Detallados

### 1. UserDocument (Usuarios Registrados)

**Partition Key:** `"users"`  
**Index:** `id`  
**Ejemplo de documento:**

```json
{
  "id": "user-550e8400-e29b-41d4-a716-446655440000",
  "partitionKey": "users",
  "email": "usuario@example.com",
  "displayName": "Juan Pérez García",
  "passwordHash": "$2a$12$R9h7cIPz0gi.URNNGHQ3aeFYV7pHYF...",
  "status": "active",
  "role": "user",
  "createdAt": "2026-04-03T10:30:45.123Z",
  "lastLoginAt": "2026-04-03T14:20:30.456Z",
  "isEmailVerified": true,
  "totalPoints": 250,
  "totalPredictions": 15,
  "correctPredictions": 10,
  "accuracyPercentage": 66.67,
  "leaderboardRank": 5,
  "phoneNumber": "+573001234567",
  "avatarUrl": "https://example.com/avatars/user-123.jpg"
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID único del usuario |
| `partitionKey` | string (literal) | Siempre "users" |
| `email` | string | Email único del usuario (también clave de búsqueda) |
| `displayName` | string | Nombre completo mostrado en la app |
| `passwordHash` | string | Contraseña hasheada con BCrypt (costo 12) |
| `status` | string | "active" \| "inactive" \| "banned" |
| `role` | string | "user" \| "admin" |
| `createdAt` | datetime | Fecha de registro |
| `lastLoginAt` | datetime | Última vez que inició sesión |
| `isEmailVerified` | boolean | ✅ true (verificado por invitación) |
| `totalPoints` | integer | Puntos acumulados por predicciones correctas |
| `totalPredictions` | integer | Cantidad total de predicciones hechas |
| `correctPredictions` | integer | Cantidad de predicciones correctas |
| `accuracyPercentage` | decimal | % de precisión (correctPredictions / totalPredictions) |
| `leaderboardRank` | integer \| null | Posición en el ranking |
| `phoneNumber` | string \| null | Teléfono del usuario (opcional) |
| `avatarUrl` | string \| null | URL de la foto de perfil (opcional) |

---

### 2. InvitationDocument (Invitaciones)

**Partition Key:** `"invitations"`  
**Index:** `id`, `email`  
**Ejemplo de documento:**

```json
{
  "id": "inv-9f36bc54-d53c-47cf-8e22-3b2a6c8d9f2e",
  "partitionKey": "invitations",
  "email": "nuevo_usuario@example.com",
  "token": "U2FsdGVkX1/dH/8qR9nK=...",
  "status": "used",
  "createdAt": "2026-04-03T10:30:45.123Z",
  "expiresAt": "2026-04-04T10:30:45.123Z",
  "usedAt": "2026-04-03T11:00:00.000Z",
  "notificationChannel": "email",
  "phoneNumber": null
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID único de la invitación |
| `partitionKey` | string (literal) | Siempre "invitations" |
| `email` | string | Email al cual se envió la invitación |
| `token` | string | Token encriptado (AES-256) |
| `status` | string | "pending" \| "used" \| "expired" |
| `createdAt` | datetime | Cuándo se creó la invitación |
| `expiresAt` | datetime | Cuándo expira (createdAt + 24h) |
| `usedAt` | datetime \| null | Cuándo se registró el usuario |
| `notificationChannel` | string | "email" \| "whatsapp" |
| `phoneNumber` | string \| null | Teléfono (si es WhatsApp) |

**Estados:**
- `"pending"` - Invitación creada, esperando que el usuario se registre
- `"used"` - Usuario completó el registro
- `"expired"` - Han pasado 24 horas sin uso

---

### 3. EventDocument (Eventos Especiales)

**Partition Key:** `"events"`  
**Index:** `id`, `date`  
**Ejemplo de documento:**

```json
{
  "id": "evt-a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "partitionKey": "events",
  "title": "Watch Party - Argentina vs Brasil",
  "description": "Reunión para ver el partido en directo con la comunidad",
  "type": "watch_party",
  "date": "2026-06-15T18:00:00.000Z",
  "location": "Café Colombia, Centro",
  "locationUrl": "https://maps.google.com/...",
  "maxCapacity": 50,
  "status": "active",
  "createdAt": "2026-04-03T10:30:45.123Z",
  "createdBy": "admin-user-id-123",
  "updatedAt": "2026-04-03T12:00:00.000Z",
  "updatedBy": "admin-user-id-123"
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID único del evento |
| `partitionKey` | string (literal) | Siempre "events" |
| `title` | string | Título del evento |
| `description` | string \| null | Descripción detallada |
| `type` | string | "watch_party" \| "meeting" \| "activity" \| "other" |
| `date` | datetime | Fecha y hora del evento |
| `location` | string \| null | Ubicación física |
| `locationUrl` | string \| null | Link a Google Maps u otro |
| `maxCapacity` | integer \| null | Límite de asistentes |
| `status` | string | "active" \| "cancelled" |
| `createdAt` | datetime | Cuándo se creó el evento |
| `createdBy` | string | ID del admin que lo creó |
| `updatedAt` | datetime \| null | Última actualización |
| `updatedBy` | string \| null | ID del admin que actualizó |

---

### 4. RaffleDocument (Rifas)

**Partition Key:** `"raffles"`  
**Index:** `id`, `status`  
**Ejemplo de documento:**

```json
{
  "id": "raffle-xyz123-abc456",
  "partitionKey": "raffles",
  "title": "Rifa Camiseta Colombia Edición Especial",
  "description": "Sorteo de 1 camiseta oficial de Colombia",
  "prize": "Camiseta Colombia Oficial 2026",
  "numberOfWinners": 1,
  "participationMode": "first_N",
  "maxParticipants": 50,
  "targetGender": null,
  "participants": [
    "user-001",
    "user-002",
    "user-003",
    "..."
  ],
  "winners": [
    "user-042"
  ],
  "status": "drawn",
  "drawAt": "2026-04-03T15:30:00.000Z",
  "createdAt": "2026-04-03T10:00:00.000Z",
  "createdBy": "admin-user-id-123"
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | ID único de la rifa |
| `partitionKey` | string (literal) | Siempre "raffles" |
| `title` | string | Nombre de la rifa |
| `description` | string \| null | Descripción del premio |
| `prize` | string | Descripción del premio a ganar |
| `numberOfWinners` | integer | Cantidad de ganadores |
| `participationMode` | string | "all" \| "first_N" \| "manual" \| "gender" |
| `maxParticipants` | integer \| null | Límite de participantes (si first_N) |
| `targetGender` | string \| null | Género filtro (si es gender mode) |
| `participants` | array[string] | Lista de IDs de usuarios participantes |
| `winners` | array[string] | Lista de IDs de ganadores |
| `status` | string | "open" \| "closed" \| "drawn" |
| `drawAt` | datetime \| null | Cuándo se hizo el sorteo |
| `createdAt` | datetime | Cuándo se creó la rifa |
| `createdBy` | string | ID del admin que la creó |

**Modos de Participación:**
- `"all"` - Todos los usuarios activos participan automáticamente
- `"first_N"` - Los primeros N usuarios registrados (maxParticipants define N)
- `"manual"` - Solo usuarios agregados manualmente por el admin
- `"gender"` - Usuarios activos con el género especificado (targetGender)

---

### 5. Match (Partidos)

**Partition Key:** Implícita (posiblemente `tournamentId`)  
**Container:** `matches`  
**Index:** `id`, `status`, `kickoffAtUtc`  
**Ejemplo de documento:**

```json
{
  "id": "match-2026-worldcup-001",
  "tournamentId": "worldcup-2026",
  "homeTeam": "Argentina",
  "awayTeam": "Brasil",
  "kickoffAtUtc": "2026-06-15T18:00:00.000Z",
  "stage": "GROUP_STAGE",
  "status": "FINISHED",
  "homeScoreFinal": 2,
  "awayScoreFinal": 1
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del partido |
| `tournamentId` | string | Referencia al torneo ("worldcup-2026") |
| `homeTeam` | string | Nombre del equipo local |
| `awayTeam` | string | Nombre del equipo visitante |
| `kickoffAtUtc` | datetime | Hora de inicio del partido |
| `stage` | string | "GROUP_STAGE" \| "ROUND_OF_16" \| "QUARTER_FINALS" \| "SEMI_FINALS" \| "FINAL" |
| `status` | string | "SCHEDULED" \| "LIVE" \| "FINISHED" |
| `homeScoreFinal` | integer \| null | Goles del equipo local (si finished) |
| `awayScoreFinal` | integer \| null | Goles del equipo visitante (si finished) |

---

### 6. Prediction (Predicción de Usuario)

**Partition Key:** Implícita (posiblemente `userId`)  
**Container:** `predictions`  
**Index:** `id`, `userId`, `matchId`  
**Ejemplo de documento:**

```json
{
  "id": "pred-user-001-match-001",
  "userId": "user-550e8400-e29b-41d4-a716-446655440000",
  "matchId": "match-2026-worldcup-001",
  "homeScorePred": 2,
  "awayScorePred": 1,
  "createdAtUtc": "2026-06-10T10:30:45.123Z",
  "updatedAtUtc": "2026-06-14T18:00:00.000Z",
  "lockedAt": "2026-06-15T17:55:00.000Z",
  "submittedAtUtc": "2026-06-14T18:00:00.000Z",
  "pointsAwarded": 25
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único de la predicción |
| `userId` | string | ID del usuario que predice |
| `matchId` | string | ID del partido predicho |
| `homeScorePred` | integer | Goles predichos para equipo local |
| `awayScorePred` | integer | Goles predichos para equipo visitante |
| `createdAtUtc` | datetime | Cuándo se creó la predicción |
| `updatedAtUtc` | datetime | Última actualización |
| `lockedAt` | datetime \| null | Cuándo se bloqueó (cercano al partido) |
| `submittedAtUtc` | datetime | Cuándo se envió |
| `pointsAwarded` | integer \| null | Puntos ganados (si ya se jugó) |

---

### 7. Score (Leaderboard/Ranking)

**Partition Key:** Implícita (posiblemente `userId`)  
**Container:** `scores`  
**Index:** `rank`, `totalPoints`  
**Ejemplo de documento:**

```json
{
  "id": "score-user-001",
  "userId": "user-550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Juan Pérez García",
  "totalPoints": 850,
  "totalPredictions": 45,
  "exactScores": 8,
  "correctWinners": 35,
  "rank": 2
}
```

**Campos Explicados:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único del score |
| `userId` | string | ID del usuario |
| `displayName` | string | Nombre mostrado |
| `totalPoints` | integer | Puntos totales acumulados |
| `totalPredictions` | integer | Predicciones hechas |
| `exactScores` | integer | Predicciones con resultado exacto |
| `correctWinners` | integer | Predicciones con ganador correcto |
| `rank` | integer | Posición en el ranking |

---

## 🔗 Relaciones Entre Documentos

```
User Document
    ├─→ InvitationDocument (invitación que usó para registrarse)
    ├─→ Prediction[] (predicciones que ha hecho)
    ├─→ Score (su puntuación en el leaderboard)
    └─→ RaffleDocument[] (rifas en las que participa)

RaffleDocument
    ├─→ User[] (participantes - referencia por userId)
    ├─→ User[] (ganadores - referencia por userId)
    └─→ Admin (creador - referencia por userId)

EventDocument
    └─→ Admin (creador - referencia por userId)

Prediction
    ├─→ User (predictor - referencia por userId)
    ├─→ Match (partido predicho - referencia por matchId)
    └─→ Points (cuando el match termina, se asignan puntos)

Match
    └─→ Prediction[] (todas las predicciones para este match)

Score
    └─→ User (referencia por userId)
```

---

## 📊 Resumen de Contenedores

| Contenedor | Partition Key | Documentos | Propósito |
|-----------|---------------|-----------|----------|
| `users` | `partitionKey` (literal) | UserDocument, InvitationDocument, EventDocument, RaffleDocument | Almacenamiento multi-propósito |
| `matches` | `tournamentId` (inferred) | Match | Partidos del torneo |
| `predictions` | `userId` (inferred) | Prediction | Predicciones de usuarios |
| `scores` | `userId` (inferred) | Score | Leaderboard/Ranking |

---

## 📈 Índices Recomendados

### En Contenedor `users`
```json
{
  "indexingPolicy": {
    "includedPaths": [
      {
        "path": "/id/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/email/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/partitionKey/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/status/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/createdAt/?",
        "indexes": [{ "kind": "Range", "dataType": "String" }]
      }
    ]
  }
}
```

### En Contenedor `matches`
```json
{
  "indexingPolicy": {
    "includedPaths": [
      {
        "path": "/id/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/status/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/kickoffAtUtc/?",
        "indexes": [{ "kind": "Range", "dataType": "String" }]
      }
    ]
  }
}
```

---

## 🔑 Convenciones de Claves

- **UUIDs:** `550e8400-e29b-41d4-a716-446655440000`
- **Formato de Timestamp:** ISO 8601 UTC (`2026-04-03T10:30:45.123Z`)
- **Campos de Partition Key:** Literales fijas ("users", "invitations", "events", "raffles")
- **IDs:** UUID v4 o strings únicos generados por la aplicación

---

## 🔐 Consideraciones de Seguridad

1. **PasswordHash:** Almacenado con BCrypt (costo 12), nunca en texto plano
2. **Tokens:** Encriptados con AES-256, nunca en texto plano
3. **Email:** Único, indexado para búsquedas rápidas
4. **Role:** Verificado en servidor en cada request admin
5. **Partición de datos:** Permite escalabilidad y seguridad de datos

---

## 📝 Ejemplo de Query Común

### Obtener usuario por email
```sql
SELECT * FROM c 
WHERE c.email = "usuario@example.com" 
AND c.partitionKey = "users"
```

### Obtener todas las invitaciones pendientes
```sql
SELECT * FROM c 
WHERE c.partitionKey = "invitations" 
AND c.status = "pending"
ORDER BY c.createdAt DESC
```

### Obtener predicciones de un usuario para un match
```sql
SELECT * FROM c 
WHERE c.userId = "user-123" 
AND c.matchId = "match-001"
```

### Obtener top 10 usuarios por puntos
```sql
SELECT TOP 10 * FROM c 
ORDER BY c.totalPoints DESC
```

### Obtener eventos futuros
```sql
SELECT * FROM c 
WHERE c.partitionKey = "events" 
AND c.date >= @today
ORDER BY c.date ASC
```

---

## 📋 Checklist de Estructura

- ✅ UserDocument - Usuarios registrados
- ✅ InvitationDocument - Sistema de invitaciones
- ✅ EventDocument - Eventos especiales
- ✅ RaffleDocument - Sistema de rifas
- ✅ Match - Partidos del torneo
- ✅ Prediction - Predicciones de usuarios
- ✅ Score - Leaderboard/Ranking
- ✅ Indices - Para búsquedas rápidas
- ✅ Partition Keys - Para escalabilidad
- ✅ Convenciones - Para consistencia

---

## Resumen

**Base de Datos:** Cosmos DB (NoSQL)  
**Contenedores:** 4 (users, matches, predictions, scores)  
**Documentos:** 7 tipos diferentes  
**Relaciones:** Por referencia mediante IDs  
**Escalabilidad:** Por partition keys configurables  
**Seguridad:** Encriptación, hashing BCrypt, validación de servidor

