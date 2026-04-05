# Testing con La Liga (Primera División España)

## Overview

Dos Azure Functions adicionales para probar el comportamiento del sistema usando partidos de **La Liga** mientras esperas el Mundial 2026.

### Ventajas de Testear con La Liga

| Aspecto | Ventaja |
|--------|---------|
| **Frecuencia** | Múltiples partidos cada fin de semana |
| **Predicción Real** | Datos reales para validar lógica de puntos |
| **Comportamiento** | Pruebas del mismo sistema que usará el Mundial |
| **Timing** | Puedes hacer predicciones HOY, no en junio |

---

## Funciones Disponibles

### 1. ScheduledFetchLaLigaMatchesFunction
- **Archivo**: `api/Functions/ScheduledFetchLaLigaMatchesFunction.cs`
- **Trigger**: Diariamente a las 3 AM UTC
- **Propósito**: Obtener próximos 7 días de partidos de La Liga
- **Consumo**: ~7 requests/día

### 2. ScheduledFetchLaLigaResultsFunction
- **Archivo**: `api/Functions/ScheduledFetchLaLigaResultsFunction.cs`
- **Trigger**: Cada 5 minutos
- **Propósito**: Obtener resultados finales de partidos completados
- **Consumo**: ~35 requests/día

---

## Consumo de API

Con ambas funciones de La Liga + Mundial:

```
La Liga Matches:      7 requests/día
La Liga Results:     35 requests/día
World Cup Matches:    7 requests/día (solo cuando está activo)
World Cup Results:   35 requests/día (solo cuando está activo)

Total plan gratuito: 100 requests/día
```

**Durante el Mundial**: Cambiar a funciones de World Cup, pausar La Liga
**Antes del Mundial**: Usar La Liga para testing

---

## Cronograma de Testing

### Fase 1: Pre-Testing (Ahora)
```
✅ Usar funciones de La Liga
✅ Hacer predicciones en partidos reales
✅ Validar sistema de puntos
✅ Probar cálculo de rankings
```

### Fase 2: Mundial (Junio 2026)
```
✅ Pausar funciones de La Liga (si es necesario)
✅ Activar funciones de World Cup
✅ Usar todos los 100 requests diarios en Mundial
```

---

## Integración en Program.cs

Las funciones se registran automáticamente en la inyección de dependencias:

```csharp
// En Program.cs - Se cargan todas las Azure Functions automáticamente
var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddScoped<IFootballDataService, FootballDataService>();
        services.AddScoped<IMatchRepository, MatchRepository>();
        // Las funciones scheduled se cargan automáticamente
    })
    .Build();

await host.RunAsync();
```

---

## Monitoreo de Testing

### Ver en Azure Portal

```
Monitor > Metrics
- Application Insights: ScheduledFetchLaLigaMatches
- Application Insights: ScheduledFetchLaLigaResults
```

### Logs Esperados

**3 AM - Fetch Matches**:
```
Found 380 total La Liga matches, 3 upcoming in next 7 days
Storing La Liga match: Real Madrid vs Barcelona - 2026-04-10T16:00:00Z
Successfully stored 3 upcoming La Liga matches
ScheduledFetchLaLigaMatches completed successfully
```

**Cada 5 minutos - Fetch Results**:
```
Checking 2 La Liga matches for final results
La Liga match finished: Real Madrid 2 - 1 Barcelona
Processing predictions for La Liga match ID
ScheduledFetchLaLigaResults completed: 1 matches updated, 1 with final results
```

---

## Hacer Predicciones en La Liga

### Via API

```bash
curl -X POST "http://localhost:7071/api/predictions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "matchId": "544123",
    "homeScorePred": 2,
    "awayScorePred": 1
  }'
```

### Campos Compatibles

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| matchId | ID del partido de La Liga | "544123" |
| homeScorePred | Goles predichos local | 2 |
| awayScorePred | Goles predichos visitante | 1 |

---

## Validar Sistema de Puntos con La Liga

### Casos de Prueba

| Escenario | Predicción | Resultado Real | Puntos |
|-----------|-----------|----------------|--------|
| Exacto | 2-1 | 2-1 | 3 pts ✓ |
| Ganador | 2-1 | 1-0 | 1 pt ✓ |
| Incorrecto | 2-1 | 0-2 | 0 pts ✓ |

### Verificar Ranking

```bash
curl -X GET "http://localhost:7071/api/ranking" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Response:
```json
[
  {
    "rank": 1,
    "userId": "user-123",
    "displayName": "Juan Pérez",
    "totalPoints": 15,
    "totalPredictions": 5,
    "exactScores": 2,
    "correctWinners": 3
  }
]
```

---

## Cambiar Entre La Liga y Mundial

### Opción 1: Deshabilitar Funciones

En Azure Portal > Function App:
```
ScheduledFetchLaLigaMatches     → Disable
ScheduledFetchLaLigaResults      → Disable
ScheduledFetchMatches             → Enable
ScheduledFetchResults             → Enable
```

### Opción 2: Modificar Timer Triggers

Cambiar en el código:
```csharp
// Para Mundial
[TimerTrigger("0 3 * * *")]
[TimerTrigger("*/5 * * * *")]

// Para desactivar (comentar)
// [TimerTrigger("0 3 * * *")]
// [TimerTrigger("*/5 * * * *")]
```

---

## Diferencias Entre La Liga y Mundial

| Aspecto | La Liga | Mundial |
|--------|--------|---------|
| **Competición** | Liga doméstica | Torneo internacional |
| **Equipos** | 20 equipos | ~32 naciones |
| **Disponibilidad** | Siempre |  Junio-Julio 2026 |
| **Predicciones** | Practiqua ahora | Usa el sistema real |
| **Temporada** | 2025-26 | Única (2026) |

---

## Tips para Testing

1. **Hacer múltiples predicciones**: Valida que el sistema guarde varias
2. **Editar predicción antes del match**: Verifica bloqueo de predicciones
3. **Esperar resultado**: Valida cálculo automático de puntos
4. **Verificar ranking**: Confirma orden correcto
5. **Revisar logs**: Usa Application Insights para debuggear

---

## Troubleshooting

### No aparecen partidos de La Liga

```
Problema: ScheduledFetchLaLigaMatches no está trayendo datos
Solución:
1. Verificar que FOOTBALL_DATA_API_KEY está configurado
2. Revisar logs de FootballDataService
3. Confirmar que GetSpanishLaLigaMatches() devuelve datos
```

### Predicciones no se guardan

```
Problema: POST /api/predictions retorna error
Solución:
1. Verificar JWT token válido
2. Confirmar matchId existe en BD
3. Revisar error en Application Insights
```

### Resultados no se actualizan

```
Problema: Partidos terminados no tienen scores finales
Solución:
1. Esperar 105+ minutos después del inicio del partido
2. Verificar status en Football-Data.org es "FINISHED"
3. Revisar logs de ScheduledFetchLaLigaResults
```

---

## Próximos Pasos

1. ✅ Compilar proyecto con nuevas funciones
2. ✅ Deployar a Azure o probar en local con `func start`
3. ✅ Hacer predicciones en partidos de La Liga
4. ✅ Validar sistema de puntos
5. ✅ Cuando llegue junio 2026, cambiar a funciones del Mundial

---

## Última Actualización

2026-04-05

**Version**: 1.0.0 (Testing)
