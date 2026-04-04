# FIFA API Integration - World Cup 2026

## ?? Descripción

Esta integración consume directamente la **API oficial de FIFA** para obtener datos del Mundial 2026, incluyendo:
- ? Fixtures (partidos programados)
- ? Resultados en tiempo real
- ? Partidos en vivo
- ? Detalles de partidos (eventos, goles, tarjetas)
- ? Tabla de posiciones por grupos
- ? Estadios, árbitros, clima

## ?? Endpoints Disponibles

### 1. Obtener Todos los Fixtures
```http
GET /api/fifa/fixtures
```

**Query Parameters:**
- `country` (opcional): Código del país (ej: `CO`, `AR`, `BR`, `MX`, `US`)
- `stage` (opcional): ID de la fase del torneo
- `fromDate` (opcional): Fecha desde (formato: `YYYY-MM-DD`)
- `toDate` (opcional): Fecha hasta (formato: `YYYY-MM-DD`)

**Ejemplos:**
```bash
# Todos los partidos del Mundial 2026
curl http://localhost:7071/api/fifa/fixtures

# Partidos de Colombia
curl http://localhost:7071/api/fifa/fixtures?country=CO

# Partidos entre dos fechas
curl http://localhost:7071/api/fifa/fixtures?fromDate=2026-06-11&toDate=2026-06-15

# Partidos de México en una fase específica
curl http://localhost:7071/api/fifa/fixtures?country=MX&stage=285085
```

---

### 2. Obtener Fixtures por Fecha Específica
```http
GET /api/fifa/fixtures/date/{date}
```

**Path Parameters:**
- `date` (requerido): Fecha en formato `YYYY-MM-DD`

**Query Parameters:**
- `country` (opcional): Código del país

**Ejemplos:**
```bash
# Todos los partidos del 11 de junio de 2026
curl http://localhost:7071/api/fifa/fixtures/date/2026-06-11

# Partidos de Brasil el 11 de junio
curl http://localhost:7071/api/fifa/fixtures/date/2026-06-11?country=BR
```

---

### 3. Obtener Partidos en Vivo
```http
GET /api/fifa/fixtures/live
```

**Ejemplo:**
```bash
curl http://localhost:7071/api/fifa/fixtures/live
```

**Respuesta:** Retorna solo los partidos con `MatchStatus = 3` (en vivo)

---

### 4. Obtener Detalles de un Partido
```http
GET /api/fifa/match/{matchId}
```

**Path Parameters:**
- `matchId` (requerido): ID del partido en FIFA

**Ejemplo:**
```bash
curl http://localhost:7071/api/fifa/match/400235460
```

**Respuesta incluye:**
- Información del partido
- Eventos (goles, tarjetas, sustituciones)
- Árbitros
- Clima del estadio
- Timeline completo

---

### 5. Obtener Tabla de Posiciones
```http
GET /api/fifa/standings
```

**Ejemplo:**
```bash
curl http://localhost:7071/api/fifa/standings
```

**Respuesta:** Tabla de posiciones por grupos con:
- Partidos jugados
- Ganados/Empatados/Perdidos
- Goles a favor/en contra
- Diferencia de goles
- Puntos
- Posición en el grupo

---

## ?? Estructura de Respuesta

### Fixture (Match)
```json
{
  "Results": [
    {
      "IdMatch": "400235460",
      "Date": "2026-06-11T18:00:00Z",
      "LocalDate": "2026-06-11T14:00:00-04:00",
      "MatchStatus": 0,
      "StageName": [
        {
          "Locale": "es-ES",
          "Description": "Fase de grupos"
        }
      ],
      "Home": {
        "IdTeam": "43930",
        "TeamName": [
          {
            "Locale": "es-ES",
            "Description": "Colombia"
          }
        ],
        "Abbreviation": "COL",
        "PictureUrl": "https://..."
      },
      "Away": {
        "IdTeam": "43970",
        "TeamName": [
          {
            "Locale": "es-ES",
            "Description": "México"
          }
        ],
        "Abbreviation": "MEX",
        "PictureUrl": "https://..."
      },
      "Stadium": {
        "Name": [
          {
            "Locale": "es-ES",
            "Description": "Estadio Azteca"
          }
        ],
        "CityName": [
          {
            "Locale": "es-ES",
            "Description": "Ciudad de México"
          }
        ]
      },
      "HomeTeamScore": null,
      "AwayTeamScore": null,
      "MatchStatus": 0
    }
  ]
}
```

### Match Status
- `0`: No iniciado
- `3`: En vivo
- `10`: Finalizado

---

## ??? Códigos de País Soportados

### CONMEBOL
- `AR` - Argentina
- `BR` - Brasil
- `CO` - Colombia
- `EC` - Ecuador
- `PY` - Paraguay
- `PE` - Perú
- `UY` - Uruguay
- `CL` - Chile
- `BO` - Bolivia
- `VE` - Venezuela

### CONCACAF
- `MX` - México
- `US` - Estados Unidos
- `CA` - Canadá
- `CR` - Costa Rica
- `PA` - Panamá
- `JM` - Jamaica
- `HN` - Honduras

### UEFA (principales)
- `DE` - Alemania
- `ES` - España
- `FR` - Francia
- `IT` - Italia
- `GB-ENG` - Inglaterra
- `PT` - Portugal
- `NL` - Países Bajos
- `BE` - Bélgica

### AFC (principales)
- `JP` - Japón
- `KR` - Corea del Sur
- `IR` - Irán
- `SA` - Arabia Saudita
- `AU` - Australia

### CAF (principales)
- `MA` - Marruecos
- `SN` - Senegal
- `TN` - Túnez
- `NG` - Nigeria

---

## ?? Configuración

No se requiere configuración adicional. La API de FIFA es pública y no requiere API Key.

### Headers Utilizados
```
Accept: application/json
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

---

## ?? Testing Local

1. **Iniciar Azure Functions:**
   ```bash
   cd api
   func start
   ```

2. **Probar endpoint:**
   ```bash
   curl http://localhost:7071/api/fifa/fixtures?country=CO
   ```

3. **Ver Swagger UI:**
   - Abre `http://localhost:7071/api/swagger/ui`

---

## ?? Notas Importantes

### IDs de Torneo y Temporada
Los valores actuales son:
- `CompetitionId = "17"` (FIFA World Cup)
- `SeasonId = "285073"` (Temporada 2026)

?? **Importante:** Estos IDs pueden cambiar. Para verificar los valores correctos:
1. Abre las DevTools del navegador en https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026
2. Ve a la pestaña Network
3. Busca requests a `api.fifa.com/api/v3/`
4. Observa los parámetros `idCompetition` e `idSeason`

### Rate Limiting
La API de FIFA puede tener límites de tasa no documentados. Considera:
- Implementar caché para requests frecuentes
- Agregar retry logic con backoff exponencial
- Monitorear respuestas 429 (Too Many Requests)

### Datos en Tiempo Real
Los datos se actualizan en tiempo real durante los partidos. Para obtener updates:
- Polling cada 30-60 segundos en partidos en vivo
- SignalR o WebSockets para updates push (requiere implementación adicional)

---

## ?? Comparación: FIFA vs API-Football

| Característica | FIFA API | API-Football |
|----------------|----------|--------------|
| **Costo** | ? Gratis | ? De pago |
| **Datos Oficiales** | ? Sí | ?? Terceros |
| **Mundial 2026** | ? Completo | ?? Depende de plan |
| **Rate Limits** | ?? No documentado | ? Definido por plan |
| **Documentación** | ? No oficial | ? Oficial |
| **Estabilidad** | ? Alta | ? Alta |

**Recomendación:** Usa FIFA API como fuente primaria para el Mundial 2026.

---

## ?? Troubleshooting

### Error: "Null response from FIFA API"
- Verifica que los IDs de competición y temporada sean correctos
- Revisa el formato de la URL generada en los logs

### Error: HTTP 404
- El `matchId` no existe o es inválido
- Verifica el ID correcto desde la lista de fixtures

### Error: HTTP 429 (Too Many Requests)
- Implementa rate limiting en tu lado
- Agrega delays entre requests
- Considera implementar caché

### Respuesta vacía (Results = [])
- No hay partidos en la fecha especificada
- El código de país es inválido
- La fecha está fuera del rango del torneo

---

## ?? Referencias

- [FIFA.com Official Website](https://www.fifa.com/)
- [World Cup 2026 Schedule](https://www.fifa.com/es/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures)

---

## ?? Migración desde API-Football

Si estabas usando `ApiFootballFunction`:

**Antes:**
```http
GET /api/football/fixtures/date/2026-06-11?league=1
```

**Ahora:**
```http
GET /api/fifa/fixtures/date/2026-06-11
```

Los endpoints de API-Football siguen disponibles para otras ligas y torneos.
