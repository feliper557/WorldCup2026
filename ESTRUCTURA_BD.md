# 📊 Estructura de Base de Datos - WorldCup 2026 API

**Versión:** 1.0  
**Última actualización:** 2026-04-03  
**Autor:** Felipe Rodriguez  
**Estado:** ✅ Producción

---

## Tabla de Contenidos

- [1. Información General](#1-información-general)
- [2. Arquitectura de la Base de Datos](#2-arquitectura-de-la-base-de-datos)
- [3. Contenedores](#3-contenedores)
- [4. Esquema de Documentos](#4-esquema-de-documentos)
- [5. Tipos de Datos](#5-tipos-de-datos)
- [6. Índices](#6-índices)
- [7. Partition Keys](#7-partition-keys)
- [8. Relaciones](#8-relaciones)
- [9. Convenciones](#9-convenciones)
- [10. Ejemplos de Queries](#10-ejemplos-de-queries)

---

## 1. Información General

### 1.1 Especificaciones Técnicas

| Propiedad | Valor |
|-----------|-------|
| **Proveedor** | Microsoft Azure |
| **Servicio** | Azure Cosmos DB |
| **Modelo** | NoSQL (Document Store) |
| **Database** | `worldcup-db` |
| **Contenedores** | 4 |
| **Región** | Azure (configurable) |
| **Replicación** | Multi-región (configurable) |

### 1.2 Características

- ✅ Sin esquema (Schema-less)
- ✅ Escalabilidad horizontal
- ✅ Consistencia eventual
- ✅ Transacciones ACID por documento
- ✅ Índices automáticos
- ✅ Queries SQL-like (SQL API)

---

## 2. Arquitectura de la Base de Datos

### 2.1 Diagrama de Contenedores

```
┌─────────────────────────────────────────────────────────┐
│            worldcup-db (Database)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────┐ │
│  │    users       │  │    matches     │  │predictions
│  │   (Container)  │  │   (Container)  │  │(Container)
│  │                │  │                │  │          │ │
│  │ • UserDoc      │  │ • MatchDoc     │  │ • PredDoc│ │
│  │ • InviteDoc    │  │                │  │          │ │
│  │ • EventDoc     │  └────────────────┘  └──────────┘ │
│  │ • RaffleDoc    │                                    │
│  │                │    ┌────────────────┐              │
│  └────────────────┘    │     scores     │              │
│                        │   (Container)  │              │
│                        │                │              │
│                        │  • ScoreDoc    │              │
│                        │                │              │
│                        └────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

```
Admin crea invitación
        ↓
InvitationDocument (users container, partitionKey="invitations")
        ↓
Usuario se registra
        ↓
UserDocument (users container, partitionKey="users")
        ↓
Usuario hace predicciones
        ↓
Prediction (predictions container, partitionKey=userId)
        ↓
Match termina → Se actualizan puntos
        ↓
Score (scores container, partitionKey=userId)
        ↓
Leaderboard actualizado
```

---

## 3. Contenedores

### 3.1 Contenedor: `users`

**Propósito:** Almacenamiento de múltiples tipos de documentos relacionados a usuarios

**Configuración:**
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `users` |
| **Partition Key** | `/partitionKey` |
| **Throughput** | 400 RU/s (configurable) |
| **TTL** | Deshabilitado |
| **Indexación** | Automática |

**Documentos almacenados:**
- `UserDocument` (partitionKey = "users")
- `InvitationDocument` (partitionKey = "invitations")
- `EventDocument` (partitionKey = "events")
- `RaffleDocument` (partitionKey = "raffles")

---

### 3.2 Contenedor: `matches`

**Propósito:** Almacenar información de partidos del torneo

**Configuración:**
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `matches` |
| **Partition Key** | `/tournamentId` |
| **Throughput** | 400 RU/s (configurable) |
| **TTL** | Deshabilitado |
| **Indexación** | Automática |

**Documentos almacenados:**
- `Match` (un partido por documento)

---

### 3.3 Contenedor: `predictions`

**Propósito:** Almacenar predicciones de usuarios para partidos

**Configuración:**
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `predictions` |
| **Partition Key** | `/userId` |
| **Throughput** | 400 RU/s (configurable) |
| **TTL** | Deshabilitado |
| **Indexación** | Automática |

**Documentos almacenados:**
- `Prediction` (una predicción por documento)

---

### 3.4 Contenedor: `scores`

**Propósito:** Almacenar puntuaciones y ranking de usuarios

**Configuración:**
| Propiedad | Valor |
|-----------|-------|
| **Nombre** | `scores` |
| **Partition Key** | `/userId` |
| **Throughput** | 400 RU/s (configurable) |
| **TTL** | Deshabilitado |
| **Indexación** | Automática |

**Documentos almacenados:**
- `Score` (una puntuación por usuario)

---

## 4. Esquema de Documentos

### 4.1 UserDocument

**Propósito:** Representar un usuario registrado en la aplicación

**Ubicación:** Contenedor `users`, partitionKey = "users"

**Estructura JSON:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
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
  "avatarUrl": "https://example.com/avatars/user-550e8400.jpg"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string (UUID) | ✅ | Identificador único del usuario |
| `partitionKey` | string | ✅ | Literal: "users" |
| `email` | string | ✅ | Email único (única forma de login) |
| `displayName` | string | ✅ | Nombre completo para mostrar |
| `passwordHash` | string | ✅ | Hash BCrypt(costo=12) de contraseña |
| `status` | string | ✅ | "active" \| "inactive" \| "banned" |
| `role` | string | ✅ | "user" \| "admin" |
| `createdAt` | datetime | ✅ | ISO 8601 UTC, fecha de registro |
| `lastLoginAt` | datetime | ❌ | ISO 8601 UTC, último login |
| `isEmailVerified` | boolean | ✅ | true si email verificado (por invitación) |
| `totalPoints` | integer | ✅ | Puntos acumulados (default: 0) |
| `totalPredictions` | integer | ✅ | Cantidad de predicciones (default: 0) |
| `correctPredictions` | integer | ✅ | Predicciones correctas (default: 0) |
| `accuracyPercentage` | decimal | ✅ | % precisión = correct/total * 100 |
| `leaderboardRank` | integer | ❌ | Posición en ranking (calculado) |
| `phoneNumber` | string | ❌ | Formato: +{código}{número} |
| `avatarUrl` | string | ❌ | URL HTTPS de foto de perfil |

**Índices necesarios:**
- `id` (Hash)
- `email` (Hash)
- `partitionKey` (Hash)
- `createdAt` (Range)
- `totalPoints` (Range)

---

### 4.2 InvitationDocument

**Propósito:** Representar una invitación para que un usuario se registre

**Ubicación:** Contenedor `users`, partitionKey = "invitations"

**Estructura JSON:**

```json
{
  "id": "9f36bc54-d53c-47cf-8e22-3b2a6c8d9f2e",
  "partitionKey": "invitations",
  "email": "nuevo_usuario@example.com",
  "token": "U2FsdGVkX1/dH/8qR9nK=...",
  "status": "pending",
  "createdAt": "2026-04-03T10:30:45.123Z",
  "expiresAt": "2026-04-04T10:30:45.123Z",
  "usedAt": null,
  "notificationChannel": "email",
  "phoneNumber": null
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string (UUID) | ✅ | Identificador único de invitación |
| `partitionKey` | string | ✅ | Literal: "invitations" |
| `email` | string | ✅ | Email del invitado |
| `token` | string | ✅ | Token AES-256 encriptado |
| `status` | string | ✅ | "pending" \| "used" \| "expired" |
| `createdAt` | datetime | ✅ | ISO 8601 UTC, cuando se creó |
| `expiresAt` | datetime | ✅ | ISO 8601 UTC, createdAt + 24h |
| `usedAt` | datetime | ❌ | ISO 8601 UTC, cuando se registró |
| `notificationChannel` | string | ✅ | "email" \| "whatsapp" |
| `phoneNumber` | string | ❌ | Requerido si notificationChannel="whatsapp" |

**Índices necesarios:**
- `id` (Hash)
- `email` (Hash)
- `partitionKey` (Hash)
- `status` (Hash)
- `expiresAt` (Range)

---

### 4.3 EventDocument

**Propósito:** Representar un evento especial (watch party, reunión, actividad)

**Ubicación:** Contenedor `users`, partitionKey = "events"

**Estructura JSON:**

```json
{
  "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "partitionKey": "events",
  "title": "Watch Party - Argentina vs Brasil",
  "description": "Reunión comunitaria para ver el partido en directo",
  "type": "watch_party",
  "date": "2026-06-15T18:00:00.000Z",
  "location": "Café Colombia, Centro",
  "locationUrl": "https://maps.google.com/?q=Caf%C3+Colombia",
  "maxCapacity": 50,
  "status": "active",
  "createdAt": "2026-04-03T10:30:45.123Z",
  "createdBy": "admin-user-id-123",
  "updatedAt": "2026-04-03T12:00:00.000Z",
  "updatedBy": "admin-user-id-123"
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string (UUID) | ✅ | Identificador único del evento |
| `partitionKey` | string | ✅ | Literal: "events" |
| `title` | string | ✅ | Título del evento |
| `description` | string | ❌ | Descripción detallada |
| `type` | string | ✅ | "watch_party" \| "meeting" \| "activity" \| "other" |
| `date` | datetime | ✅ | ISO 8601 UTC, fecha y hora del evento |
| `location` | string | ❌ | Ubicación física |
| `locationUrl` | string | ❌ | URL a Google Maps u otro |
| `maxCapacity` | integer | ❌ | Límite de asistentes |
| `status` | string | ✅ | "active" \| "cancelled" |
| `createdAt` | datetime | ✅ | ISO 8601 UTC, cuando se creó |
| `createdBy` | string | ✅ | ID del admin que lo creó |
| `updatedAt` | datetime | ❌ | ISO 8601 UTC, última actualización |
| `updatedBy` | string | ❌ | ID del admin que actualizó |

**Índices necesarios:**
- `id` (Hash)
- `partitionKey` (Hash)
- `date` (Range)
- `status` (Hash)

---

### 4.4 RaffleDocument

**Propósito:** Representar una rifa con participantes y ganadores

**Ubicación:** Contenedor `users`, partitionKey = "raffles"

**Estructura JSON:**

```json
{
  "id": "xyz123-abc456-def789",
  "partitionKey": "raffles",
  "title": "Rifa Camiseta Colombia Edición Especial",
  "description": "Sorteo de 1 camiseta oficial de Colombia 2026",
  "prize": "Camiseta Colombia Oficial 2026",
  "numberOfWinners": 1,
  "participationMode": "first_N",
  "maxParticipants": 50,
  "targetGender": null,
  "participants": [
    "user-001",
    "user-002",
    "user-003",
    "user-042"
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

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string (UUID) | ✅ | Identificador único de la rifa |
| `partitionKey` | string | ✅ | Literal: "raffles" |
| `title` | string | ✅ | Nombre de la rifa |
| `description` | string | ❌ | Descripción |
| `prize` | string | ✅ | Descripción del premio |
| `numberOfWinners` | integer | ✅ | Cantidad de ganadores |
| `participationMode` | string | ✅ | "all" \| "first_N" \| "manual" \| "gender" |
| `maxParticipants` | integer | ❌ | Límite (requerido si participationMode="first_N") |
| `targetGender` | string | ❌ | "male" \| "female" \| "other" (si participationMode="gender") |
| `participants` | array[string] | ✅ | Lista de IDs de usuarios participantes |
| `winners` | array[string] | ✅ | Lista de IDs de ganadores (vacía hasta sorteo) |
| `status` | string | ✅ | "open" \| "closed" \| "drawn" |
| `drawAt` | datetime | ❌ | ISO 8601 UTC, cuando se hizo el sorteo |
| `createdAt` | datetime | ✅ | ISO 8601 UTC, cuando se creó |
| `createdBy` | string | ✅ | ID del admin que la creó |

**Índices necesarios:**
- `id` (Hash)
- `partitionKey` (Hash)
- `status` (Hash)
- `createdAt` (Range)

---

### 4.5 Match

**Propósito:** Representar un partido del torneo

**Ubicación:** Contenedor `matches`, partitionKey = "/tournamentId"

**Estructura JSON:**

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

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | Identificador único del partido |
| `tournamentId` | string | ✅ | "worldcup-2026" |
| `homeTeam` | string | ✅ | Nombre equipo local |
| `awayTeam` | string | ✅ | Nombre equipo visitante |
| `kickoffAtUtc` | datetime | ✅ | ISO 8601 UTC, hora de inicio |
| `stage` | string | ✅ | "GROUP_STAGE" \| "ROUND_OF_16" \| "QUARTER_FINALS" \| "SEMI_FINALS" \| "FINAL" |
| `status` | string | ✅ | "SCHEDULED" \| "LIVE" \| "FINISHED" |
| `homeScoreFinal` | integer | ❌ | Goles equipo local (requerido si FINISHED) |
| `awayScoreFinal` | integer | ❌ | Goles equipo visitante (requerido si FINISHED) |

**Índices necesarios:**
- `id` (Hash)
- `status` (Hash)
- `kickoffAtUtc` (Range)
- `stage` (Hash)

---

### 4.6 Prediction

**Propósito:** Representar una predicción de un usuario para un partido

**Ubicación:** Contenedor `predictions`, partitionKey = "/userId"

**Estructura JSON:**

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

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | Identificador único de predicción |
| `userId` | string (UUID) | ✅ | ID del usuario predictor |
| `matchId` | string | ✅ | ID del partido |
| `homeScorePred` | integer | ✅ | Goles predichos equipo local |
| `awayScorePred` | integer | ✅ | Goles predichos equipo visitante |
| `createdAtUtc` | datetime | ✅ | ISO 8601 UTC, cuando se creó |
| `updatedAtUtc` | datetime | ✅ | ISO 8601 UTC, última edición |
| `lockedAt` | datetime | ❌ | ISO 8601 UTC, bloqueado (cercano al partido) |
| `submittedAtUtc` | datetime | ✅ | ISO 8601 UTC, cuando se envió |
| `pointsAwarded` | integer | ❌ | Puntos ganados (null hasta que match termina) |

**Índices necesarios:**
- `id` (Hash)
- `userId` (Hash)
- `matchId` (Hash)
- `createdAtUtc` (Range)

---

### 4.7 Score

**Propósito:** Representar la puntuación y ranking de un usuario

**Ubicación:** Contenedor `scores`, partitionKey = "/userId"

**Estructura JSON:**

```json
{
  "id": "score-user-550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Juan Pérez García",
  "totalPoints": 850,
  "totalPredictions": 45,
  "exactScores": 8,
  "correctWinners": 35,
  "rank": 2
}
```

**Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | string | ✅ | Identificador único del score |
| `userId` | string (UUID) | ✅ | ID del usuario |
| `displayName` | string | ✅ | Nombre mostrado en leaderboard |
| `totalPoints` | integer | ✅ | Puntos totales acumulados |
| `totalPredictions` | integer | ✅ | Cantidad de predicciones |
| `exactScores` | integer | ✅ | Predicciones con resultado exacto |
| `correctWinners` | integer | ✅ | Predicciones solo con ganador correcto |
| `rank` | integer | ✅ | Posición en ranking (1, 2, 3...) |

**Índices necesarios:**
- `id` (Hash)
- `userId` (Hash)
- `rank` (Range)
- `totalPoints` (Range)

---

## 5. Tipos de Datos

### 5.1 Tipos Primitivos

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| **String** | UTF-8 | "usuario@example.com" |
| **Integer** | 32-bit | 250 |
| **Decimal** | IEEE 754 | 66.67 |
| **Boolean** | true/false | true |
| **DateTime** | ISO 8601 | "2026-04-03T10:30:45.123Z" |
| **UUID** | RFC 4122 | "550e8400-e29b-41d4-a716-446655440000" |
| **Array** | JSON array | ["user-1", "user-2"] |
| **Object** | JSON object | { "nested": "value" } |
| **Null** | null | null |

### 5.2 Formatos Especiales

**Datetime (ISO 8601 UTC):**
```
2026-04-03T10:30:45.123Z
│        │  │  │  │  │
│        │  │  │  │  └─ Milisegundos
│        │  │  │  └───── Segundos
│        │  │  └──────── Minutos
│        │  └─────────── Horas
│        └────────────── Fecha
└───────────────────────── Siempre con Z (UTC)
```

**UUID (RFC 4122):**
```
550e8400-e29b-41d4-a716-446655440000
│      │ │    │ │    │ │
└──────┘ └────┘ └────┘ └────────────── Partes del UUID
```

**Email:**
```
usuario@ejemplo.com
└─────┬──────┴────┘
      └──── Debe cumplir RFC 5322 simplificado
```

**Hash BCrypt:**
```
$2a$12$R9h7cIPz0gi.URNNGHQ3aeFYV7pHYF...
│   │  │
│   │  └─ Costo (12 = ~100ms)
│   └──── Algoritmo BLOWFISH
└─────── Versión BCrypt
```

---

## 6. Índices

### 6.1 Índices en Contenedor `users`

```json
{
  "indexingPolicy": {
    "indexingMode": "Consistent",
    "includedPaths": [
      {
        "path": "/id/?",
        "indexes": [
          {
            "kind": "Hash",
            "dataType": "String",
            "precision": -1
          }
        ]
      },
      {
        "path": "/email/?",
        "indexes": [
          {
            "kind": "Hash",
            "dataType": "String",
            "precision": -1
          }
        ]
      },
      {
        "path": "/partitionKey/?",
        "indexes": [
          {
            "kind": "Hash",
            "dataType": "String",
            "precision": -1
          }
        ]
      },
      {
        "path": "/status/?",
        "indexes": [
          {
            "kind": "Hash",
            "dataType": "String",
            "precision": -1
          }
        ]
      },
      {
        "path": "/createdAt/?",
        "indexes": [
          {
            "kind": "Range",
            "dataType": "String",
            "precision": -1
          }
        ]
      },
      {
        "path": "/totalPoints/?",
        "indexes": [
          {
            "kind": "Range",
            "dataType": "Number",
            "precision": -1
          }
        ]
      }
    ],
    "excludedPaths": [
      {
        "path": "/\"_etag\"/*"
      }
    ]
  }
}
```

### 6.2 Índices en Contenedor `matches`

```json
{
  "indexingPolicy": {
    "indexingMode": "Consistent",
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
      },
      {
        "path": "/stage/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      }
    ]
  }
}
```

### 6.3 Índices en Contenedor `predictions`

```json
{
  "indexingPolicy": {
    "indexingMode": "Consistent",
    "includedPaths": [
      {
        "path": "/id/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/userId/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/matchId/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/createdAtUtc/?",
        "indexes": [{ "kind": "Range", "dataType": "String" }]
      }
    ]
  }
}
```

### 6.4 Índices en Contenedor `scores`

```json
{
  "indexingPolicy": {
    "indexingMode": "Consistent",
    "includedPaths": [
      {
        "path": "/id/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/userId/?",
        "indexes": [{ "kind": "Hash", "dataType": "String" }]
      },
      {
        "path": "/rank/?",
        "indexes": [{ "kind": "Range", "dataType": "Number" }]
      },
      {
        "path": "/totalPoints/?",
        "indexes": [{ "kind": "Range", "dataType": "Number" }]
      }
    ]
  }
}
```

---

## 7. Partition Keys

### 7.1 Estrategia de Particionamiento

**Contenedor `users`:**
- Partition Key: `/partitionKey` (literal)
- Valores posibles: "users", "invitations", "events", "raffles"
- Razón: Agrupar documentos relacionados y facilitar escalabilidad

**Contenedor `matches`:**
- Partition Key: `/tournamentId`
- Valores posibles: "worldcup-2026", "worldcup-2030", etc.
- Razón: Aislar partidos por torneo

**Contenedor `predictions`:**
- Partition Key: `/userId`
- Valores: UUID del usuario
- Razón: Agrupar predicciones por usuario para consultas rápidas

**Contenedor `scores`:**
- Partition Key: `/userId`
- Valores: UUID del usuario
- Razón: Acceso rápido a puntuación de un usuario

### 7.2 Consideraciones

✅ **Ventajas:**
- Escalabilidad horizontal
- Consultas dentro de una partición son más rápidas
- Mejor distribución de datos

❌ **Desventajas:**
- Queries entre particiones son más lentas
- No cambiar partition key después de crear documento

---

## 8. Relaciones

### 8.1 Relaciones entre Documentos

```
UserDocument
    ├─ 1:N → InvitationDocument
    │        (usuario se registró con una invitación)
    │
    ├─ 1:N → Prediction
    │        (usuario hace múltiples predicciones)
    │
    ├─ 1:1 → Score
    │        (usuario tiene una puntuación)
    │
    └─ 1:N → RaffleDocument
             (usuario participa en múltiples rifas)

Match
    └─ 1:N → Prediction
             (un partido tiene múltiples predicciones)

RaffleDocument
    ├─ N:M → UserDocument (participants)
    │        (múltiples usuarios en una rifa)
    │
    └─ N:M → UserDocument (winners)
             (múltiples ganadores de una rifa)
```

### 8.2 Implementación de Relaciones

Las relaciones se implementan por **referencia** (no embedding):

**Ejemplo: Predicción referencia a Usuario y Partido**

```json
{
  "id": "pred-user-001-match-001",
  "userId": "user-550e8400",        // ← Referencia a User
  "matchId": "match-2026-001",      // ← Referencia a Match
  "homeScorePred": 2,
  "awayScorePred": 1
}
```

**Ventajas:**
- Normalización de datos
- Evita duplicación
- Fácil actualización

**Desventajas:**
- Requiere queries adicionales (join del lado del cliente)
- Mayor latencia para datos relacionados

---

## 9. Convenciones

### 9.1 Convenciones de Nombres

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| **Contenedor** | snake_case | `users`, `matches`, `predictions` |
| **Campo** | camelCase | `createdAt`, `emailVerified`, `totalPoints` |
| **Valor booleano** | Prefijo "is" o "has" | `isEmailVerified`, `hasWon` |
| **Colección** | Plural | `participants`, `winners` |
| **UUID** | Formato estándar | `550e8400-e29b-41d4-a716-446655440000` |
| **Datetime** | ISO 8601 UTC | `2026-04-03T10:30:45.123Z` |

### 9.2 Convenciones de Tipos

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| **Estado** | Enumeración lowercase | `"active"`, `"pending"`, `"drawn"` |
| **Rol** | Enumeración lowercase | `"user"`, `"admin"` |
| **Estatus** | Enumeración UPPERCASE | `"SCHEDULED"`, `"FINISHED"` |
| **Email** | Lowercase | `usuario@example.com` |
| **Hash** | Algoritmo prefijo | `$2a$12$...` (BCrypt) |

### 9.3 Convenciones de IDs

```
UserDocument ID:    550e8400-e29b-41d4-a716-446655440000 (UUID)
InvitationDocument: inv-[uuid]
EventDocument:      evt-[uuid]
RaffleDocument:     raffle-[uuid]
Prediction ID:      pred-[userId]-[matchId]
Score ID:           score-[userId]
```

### 9.4 Valores por Defecto

| Campo | Valor por Defecto |
|-------|------------------|
| `status` (User) | "active" |
| `role` (User) | "user" |
| `isEmailVerified` | true (por invitación) |
| `totalPoints` | 0 |
| `totalPredictions` | 0 |
| `correctPredictions` | 0 |
| `notificationChannel` | "email" |

---

## 10. Ejemplos de Queries

### 10.1 Consultas en Contenedor `users`

**Obtener usuario por email:**
```sql
SELECT * FROM users u 
WHERE u.email = "usuario@example.com" 
AND u.partitionKey = "users"
```

**Obtener todas las invitaciones pendientes:**
```sql
SELECT * FROM users u 
WHERE u.partitionKey = "invitations" 
AND u.status = "pending" 
ORDER BY u.createdAt DESC
```

**Obtener eventos futuros:**
```sql
SELECT * FROM users u 
WHERE u.partitionKey = "events" 
AND u.date >= @today 
AND u.status = "active"
ORDER BY u.date ASC
```

**Obtener rifa con más participantes:**
```sql
SELECT TOP 1 * FROM users u 
WHERE u.partitionKey = "raffles"
ORDER BY ARRAY_LENGTH(u.participants) DESC
```

### 10.2 Consultas en Contenedor `matches`

**Obtener próximos partidos:**
```sql
SELECT * FROM matches m 
WHERE m.status = "SCHEDULED" 
AND m.kickoffAtUtc >= @now
ORDER BY m.kickoffAtUtc ASC
LIMIT 10
```

**Obtener partidos de una fase:**
```sql
SELECT * FROM matches m 
WHERE m.stage = "GROUP_STAGE"
ORDER BY m.kickoffAtUtc ASC
```

### 10.3 Consultas en Contenedor `predictions`

**Obtener predicciones de usuario para un partido:**
```sql
SELECT * FROM predictions p 
WHERE p.userId = "user-123" 
AND p.matchId = "match-001"
```

**Obtener predicciones no bloqueadas:**
```sql
SELECT * FROM predictions p 
WHERE p.userId = "user-123" 
AND p.lockedAt = null
```

### 10.4 Consultas en Contenedor `scores`

**Top 10 usuarios:**
```sql
SELECT TOP 10 * FROM scores s 
ORDER BY s.totalPoints DESC, s.rank ASC
```

**Obtener ranking de usuario:**
```sql
SELECT * FROM scores s 
WHERE s.userId = "user-123"
```

---

## Resumen Técnico

| Aspecto | Valor |
|--------|-------|
| **Contenedores** | 4 (users, matches, predictions, scores) |
| **Documentos** | 7 tipos |
| **Partition Keys** | 3 estrategias diferentes |
| **Índices** | Automáticos + personalizados |
| **Escalabilidad** | Horizontal (por partición) |
| **Consistencia** | Eventual |
| **Transacciones** | ACID por documento |

---

**Documento de referencia para arquitectos, desarrolladores y administradores de BD.**

