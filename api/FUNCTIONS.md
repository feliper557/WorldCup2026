# API Functions Documentation

## Football Data Endpoints

Endpoints para obtener datos de partidos del Mundial 2026 y principales ligas de fútbol desde Football-Data.org.

---

## 1. GetFootballDataFixtures

**Descripción**: Obtiene todos los partidos del Mundial 2026

**Método**: `GET`

**Ruta**: `/api/footballdata/fixtures`

**Autenticación**: No requerida

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de partidos |
| 500 | Error del servidor o API no disponible |

**Ejemplo de Respuesta** (200):

```json
[
  {
    "id": "537327",
    "tournamentId": "wc-2026",
    "homeTeam": "Mexico",
    "awayTeam": "South Africa",
    "kickoffAtUtc": "2026-06-11T19:00:00Z",
    "stage": "GROUP_STAGE",
    "status": "SCHEDULED",
    "homeScoreFinal": null,
    "awayScoreFinal": null
  },
  {
    "id": "537404",
    "tournamentId": "wc-2026",
    "homeTeam": "Uzbekistan",
    "awayTeam": "Colombia",
    "kickoffAtUtc": "2026-06-18T02:00:00Z",
    "stage": "GROUP_STAGE",
    "status": "SCHEDULED",
    "homeScoreFinal": null,
    "awayScoreFinal": null
  }
]
```

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/fixtures"
```

**Notas**:
- Retorna +100 partidos del Mundial 2026
- Incluye grupos, playoffs y final
- Estados: SCHEDULED, LIVE, FINISHED

---

## 2. GetFootballDataResults

**Descripción**: Obtiene solo los resultados finalizados del Mundial 2026

**Método**: `GET`

**Ruta**: `/api/footballdata/results`

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de resultados |
| 500 | Error |

**Ejemplo**:
```json
[
  {
    "id": "537327",
    "homeTeam": "Mexico",
    "awayTeam": "South Africa",
    "status": "FINISHED",
    "homeScoreFinal": 1,
    "awayScoreFinal": 0
  }
]
```

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/results"
```

---

## 3. GetFootballDataLive

**Descripción**: Obtiene partidos en vivo del Mundial 2026

**Método**: `GET`

**Ruta**: `/api/footballdata/live`

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de partidos en vivo |

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/live"
```

---

## 4. GetFootballDataUpcoming

**Descripción**: Obtiene próximos partidos del Mundial 2026

**Método**: `GET`

**Ruta**: `/api/footballdata/upcoming`

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de próximos partidos |

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/upcoming"
```

---

## 5. GetFootballDataMatch

**Descripción**: Obtiene detalles de un partido específico

**Método**: `GET`

**Ruta**: `/api/footballdata/match/{matchId}`

**Parámetros**:

| Nombre | Tipo | Ubicación | Requerido | Descripción |
|--------|------|-----------|-----------|------------|
| matchId | string | Path | Sí | ID del partido en Football-Data.org |

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Detalles del partido |
| 404 | Partido no encontrado |
| 500 | Error del servidor |

**Ejemplo de Respuesta** (200):
```json
{
  "id": "537327",
  "tournamentId": "wc-2026",
  "homeTeam": "Mexico",
  "awayTeam": "South Africa",
  "kickoffAtUtc": "2026-06-11T19:00:00Z",
  "stage": "GROUP_STAGE",
  "status": "FINISHED",
  "homeScoreFinal": 1,
  "awayScoreFinal": 0
}
```

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/match/537327"
```

---

## 6. GetFootballDataLaLiga

**Descripción**: Obtiene todos los partidos de La Liga - Primera División España

**Método**: `GET`

**Ruta**: `/api/footballdata/laliga`

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de partidos de La Liga |
| 500 | Error |

**Estadísticas**:
- Total partidos: 380
- Equipos: Barcelona, Real Madrid, Atlético Madrid, Valencia, Sevilla, etc.
- Temporada: 2025-2026

**Ejemplo**:
```json
[
  {
    "id": "544214",
    "homeTeam": "Girona FC",
    "awayTeam": "Rayo Vallecano de Madrid",
    "kickoffAtUtc": "2025-08-15T17:00:00Z",
    "stage": "REGULAR_SEASON",
    "status": "FINISHED",
    "homeScoreFinal": 1,
    "awayScoreFinal": 3
  }
]
```

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/laliga"
```

---

## 7. GetFootballDataLaLigaResults

**Descripción**: Obtiene resultados finalizados de La Liga ✨

**Método**: `GET`

**Ruta**: `/api/footballdata/laliga/results`

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de resultados de La Liga |
| 500 | Error |

**Ordenamiento**: Descendente por fecha (más recientes primero)

**Ejemplo**:
```json
[
  {
    "id": "544498",
    "homeTeam": "Real Madrid CF",
    "awayTeam": "Club Atlético de Madrid",
    "kickoffAtUtc": "2026-03-22T20:00:00Z",
    "status": "FINISHED",
    "homeScoreFinal": 3,
    "awayScoreFinal": 2
  },
  {
    "id": "544491",
    "homeTeam": "Athletic Club",
    "awayTeam": "Real Betis Balompié",
    "kickoffAtUtc": "2026-03-22T17:30:00Z",
    "status": "FINISHED",
    "homeScoreFinal": 2,
    "awayScoreFinal": 1
  }
]
```

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/footballdata/laliga/results"
```

---

## 8. GetMatches

**Descripción**: Obtiene partidos desde la base de datos local (Cosmos DB)

**Método**: `GET`

**Ruta**: `/api/matches`

**Parámetros**: Ninguno

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 200 | OK - Lista de partidos |
| 500 | Error de conexión a BD |

**cURL**:
```bash
curl -X GET "http://localhost:7071/api/matches"
```

**Nota**: Requiere Cosmos DB configurado

---

## 9. UpsertPrediction

**Descripción**: Crea o actualiza una predicción para un partido

**Método**: `POST`

**Ruta**: `/api/predictions`

**Parámetros**:

| Nombre | Tipo | Ubicación | Requerido | Descripción |
|--------|------|-----------|-----------|------------|
| Body | JSON | Body | Sí | Objeto de predicción |

**Modelo de Entrada**:
```json
{
  "id": "pred-001",
  "matchId": "537327",
  "userId": "user-123",
  "predictedHomeScore": 2,
  "predictedAwayScore": 1,
  "confidence": 0.85
}
```

**Respuestas**:

| Código | Descripción |
|--------|------------|
| 201 | Created - Predicción creada |
| 400 | Bad Request - Datos inválidos |
| 500 | Error del servidor |

**cURL**:
```bash
curl -X POST "http://localhost:7071/api/predictions" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "537327",
    "userId": "user-123",
    "predictedHomeScore": 2,
    "predictedAwayScore": 1
  }'
```

---

## Swagger UI

Documentación interactiva disponible en:

```
http://localhost:7071/api/swagger/ui
```

Permite probar todos los endpoints directamente desde el navegador.

---

## Rate Limiting

**Football-Data.org API**:
- Límite: 10 requests por minuto
- Plan: Gratuito

Si se alcanza el límite, los endpoints retornarán error 429 (Too Many Requests).

---

## Próximas Funciones a Implementar

### Autenticación y Usuarios

#### 1. Register
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Juan Pérez"
}
Response (201): {
  "userId": "user-123",
  "token": "jwt-token-here"
}
```

#### 2. Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "password123"
}
Response (200): {
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

#### 3. Refresh Token
```
POST /api/auth/refresh
Body: {
  "refreshToken": "refresh-token-here"
}
Response (200): {
  "token": "new-jwt-token"
}
```

#### 4. Get User Profile
```
GET /api/users/profile
Headers: Authorization: Bearer <token>
Response (200): {
  "userId": "user-123",
  "email": "user@example.com",
  "fullName": "Juan Pérez",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

### Predicciones Avanzadas

#### 1. Get User Predictions
```
GET /api/users/{userId}/predictions
Response (200): [
  {
    "id": "pred-001",
    "matchId": "537327",
    "homeTeam": "Mexico",
    "awayTeam": "South Africa",
    "predictedHomeScore": 2,
    "actualHomeScore": 1,
    "points": 5
  }
]
```

#### 2. Get Leaderboard
```
GET /api/leaderboard
Response (200): [
  {
    "rank": 1,
    "userId": "user-123",
    "fullName": "Juan Pérez",
    "totalPoints": 450,
    "correctPredictions": 28,
    "accuracy": 0.87
  }
]
```

### Notificaciones

#### 1. Suscribir a Notificaciones
```
POST /api/notifications/subscribe
Body: {
  "email": "user@example.com",
  "type": "email" | "push" | "both"
}
```

#### 2. Obtener Notificaciones
```
GET /api/notifications
Response (200): [
  {
    "id": "notif-001",
    "title": "México vs Sudáfrica",
    "message": "Partido comenzando en 30 minutos",
    "timestamp": "2026-06-11T18:30:00Z"
  }
]
```

### Estadísticas

#### 1. Get Team Stats
```
GET /api/teams/{teamId}/stats
Response (200): {
  "teamId": "team-123",
  "name": "Barcelona",
  "wins": 15,
  "draws": 3,
  "losses": 2,
  "goalsFor": 52,
  "goalsAgainst": 18,
  "goalDifference": 34
}
```

---

## Error Handling

### Formato Estándar de Errores

```json
{
  "error": "Descripción del error",
  "errorCode": "ERROR_CODE",
  "timestamp": "2026-03-31T10:30:00Z"
}
```

### Códigos de Error Comunes

| Código | HTTP | Descripción |
|--------|------|------------|
| INVALID_REQUEST | 400 | Parámetros inválidos |
| NOT_FOUND | 404 | Recurso no encontrado |
| UNAUTHORIZED | 401 | Autenticación requerida |
| FORBIDDEN | 403 | Permiso denegado |
| RATE_LIMIT_EXCEEDED | 429 | Demasiadas solicitudes |
| INTERNAL_ERROR | 500 | Error del servidor |

---

## Versioning

API versión: **1.0.0**

Cambios futuros mantendrán compatibilidad hacia atrás.

---

## Última Actualización

2026-03-31

---

**Nota**: Esta documentación se actualiza con nuevos endpoints. Consultar README.md para cambios generales en la arquitectura.
