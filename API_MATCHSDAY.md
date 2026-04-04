# Endpoint: Partidos del Día (matchsday)

## ⚠️ NOTA IMPORTANTE

**El API de BeSoccer con la API key actual tiene limitaciones para la petición `matchsday`:**
- Error común: `"not-allowed-request-cat-matchsday"` o `"not-allowed-request-for-api-account-type"`
- Esto significa que el plan de API actual puede no tener acceso completo a esta funcionalidad
- Algunos parámetros como `competitions` pueden no estar disponibles dependiendo del plan

**Alternativa recomendada:** Usar el endpoint `/api/besoccer/matches` con parámetros `league_id` y `date`

## URL Base
```
GET http://localhost:7071/api/besoccer/matchsday
```

## Descripción
Devuelve un listado de los partidos que se disputan en un día determinado y que cumplen con todos los parámetros indicados.

## Parámetros

### Obligatorios
Ninguno - Todos los parámetros son opcionales

### Opcionales

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `date` | string | Muestra los partidos del día proporcionado (formato: YYYY-MM-DD) | `2026-01-15` |
| `top` | string | Ordena por coeficientes de partido | `1` |
| `country` | string | Muestra los partidos de un país | `Spain` |
| `play` | string | Muestra los partidos que se están jugando en el momento | `1` |
| `init` | string | Índice del primer elemento a devolver en la consulta | `0` |
| `limit` | string | Número de elementos que devuelve la consulta | `20` |
| `teams` | string | Identificador del equipo del que se quieren obtener los datos | `486` |
| `competitions` | string | Filtra por los partidos de una competición (league_id) | `79469` |
| `lang` | string | Lenguaje de salida | `es` |
| `matches` | string | Muestra un partido en concreto | `18829` |
| `skip_categories` | string | Muestra todas las competiciones menos la indicada | `1` |

## Ejemplos de Uso

### 1. Obtener partidos de mañana de la liga 79469
```http
GET http://localhost:7071/api/besoccer/matchsday?date=2026-01-15&competitions=79469
```

### 2. Obtener partidos que se están jugando ahora
```http
GET http://localhost:7071/api/besoccer/matchsday?play=1
```

### 3. Obtener partidos de un equipo específico
```http
GET http://localhost:7071/api/besoccer/matchsday?teams=486
```

### 4. Obtener partidos de hoy con límite de resultados
```http
GET http://localhost:7071/api/besoccer/matchsday?date=2026-01-14&limit=10
```

### 5. Obtener partidos de un país ordenados por coeficiente
```http
GET http://localhost:7071/api/besoccer/matchsday?country=Spain&top=1
```

### 6. Combinar múltiples parámetros
```http
GET http://localhost:7071/api/besoccer/matchsday?date=2026-01-15&competitions=79469&lang=es&limit=20
```

## Respuesta

El endpoint devuelve un array JSON de objetos `BeSoccerMatch`:

```json
[
  {
    "id": "12345",
    "date": "2026-01-15",
    "time": "20:00",
    "status": "scheduled",
    "home_team": {
      "id": "123",
      "name": "Equipo A",
      "logo": "https://..."
    },
    "away_team": {
      "id": "456",
      "name": "Equipo B",
      "logo": "https://..."
    },
    "score_home": null,
    "score_away": null,
    "league_id": "79469",
    "league_name": "Liga Ejemplo"
  }
]
```

## Notas

- La caché de la petición en el API de BeSoccer es de **90 segundos**
- Si no se especifica ningún parámetro, el endpoint devuelve los partidos disponibles según la configuración predeterminada del API
- Los parámetros se pueden combinar para hacer búsquedas más específicas
- El parámetro `competitions` corresponde al `league_id` de la liga

## Comandos PowerShell de Prueba

```powershell
# Partidos de mañana de la liga 79469
$tomorrow = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri "http://localhost:7071/api/besoccer/matchsday?date=$tomorrow&competitions=79469"

# Partidos que se están jugando ahora
Invoke-RestMethod -Uri "http://localhost:7071/api/besoccer/matchsday?play=1"

# Partidos de hoy con límite
$today = (Get-Date).ToString("yyyy-MM-dd")
Invoke-RestMethod -Uri "http://localhost:7071/api/besoccer/matchsday?date=$today&limit=5"
```
