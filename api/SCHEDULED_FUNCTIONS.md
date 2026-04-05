# Scheduled Functions para Optimización de API

## Overview

Dos Azure Functions scheduled (Timer Triggered) para optimizar el consumo de la API de Football-Data.org en el plan gratuito (100 requests/día).

### Estrategia de Consumo

| Función | Frecuencia | Propósito | Consumo |
|---------|-----------|----------|---------|
| ScheduledFetchMatches | Diariamente 3 AM | Obtener próximos 7 días de partidos | ~7 requests/día |
| ScheduledFetchResults | Cada 5 minutos | Obtener resultados finales | ~35 requests/día |
| **Total** | - | - | **~42 requests/día** ✅ |

---

## 1. ScheduledFetchMatchesFunction

**Trigger**: Timer (`"0 3 * * *"` - Diariamente a las 3 AM UTC)

**Propósito**: 
- Obtener próximos 7 días de partidos del Mundial 2026
- Almacenar en base de datos
- Determinar hasta qué hora pueden hacer predicciones los usuarios

**Flujo**:
1. Se ejecuta automáticamente a las 3 AM UTC
2. Llama a `IFootballDataService.GetWorldCupMatches()`
3. Filtra partidos de los próximos 7 días
4. Almacena en Cosmos DB

**Cálculo de Bloqueo de Predicciones**:
```
Predicción permitida hasta: KickoffTime (hora de inicio)
Predicción bloqueada después: KickoffTime + 1 minuto
```

**Ejemplo de Log**:
```
Found 64 total matches, 7 upcoming in next 7 days
Storing match: Argentina vs Francia - 2026-06-14T15:00:00Z
Successfully stored 7 upcoming matches
```

---

## 2. ScheduledFetchResultsFunction

**Trigger**: Timer (`"*/5 * * * *"` - Cada 5 minutos)

**Propósito**:
- Obtener resultados finales de partidos completados
- Calcular puntos para predicciones
- Actualizar rankings

**Buffer de Tiempo**:
```
Tiempo regulación: 90 minutos
Tiempo adición (promedio): 15 minutos
Total buffer: 105 minutos

Comenzar a buscar resultados: KickoffTime + 105 minutos
```

**Flujo**:
1. Se ejecuta cada 5 minutos
2. Obtiene todos los partidos de BD
3. Identifica partidos que deberían estar terminados (KickoffTime + 105 min)
4. Llama a Football-Data.org para obtener estado actualizado
5. Si Status = "FINISHED" y hay scores:
   - Actualiza BD
   - Procesa predicciones y calcula puntos
   - Actualiza rankings

**Ejemplo de Ejecución**:
```
Checking 4 matches for final results
Match finished: Argentina 3 - 1 Francia
Match still live: Brasil vs Alemania
Completed processing predictions for match ID
ScheduledFetchResults completed: 2 matches updated
```

---

## Cálculo de Consumo de API

### Escenario Típico (7 días de Mundial)

**Fase 1 - Obtención de Partidos (3 AM)**
- 1 request para próximos 7 días de partidos
- Promedio 7 partidos/día = **7 requests**

**Fase 2 - Obtención de Resultados (cada 5 min)**
- ~7 partidos/día × máximo 5 requests por partido
- 5 requests × 26 ciclos de 5 min/día = **~35 requests**

**Total**: 7 + 35 = **42 requests/día** ✅ Dentro del límite de 100/día

### Desglose por Hora

```
03:00 - 7 requests (fetch de próximos partidos)
A partir de kickoff+105min - 1 request cada 5 min hasta que terminen todos
```

---

## Configuración

### 1. Timer Expression (Cron)

**ScheduledFetchMatches**:
```
"0 3 * * *"
Minuto 0, Hora 3, Todos los días, Todos los meses, Todos los días de semana
= Diariamente a las 3:00 AM UTC
```

**ScheduledFetchResults**:
```
"*/5 * * * *"
Cada 5 minutos, 24 horas al día, todos los días
= Cada 5 minutos
```

### 2. Variables de Entorno Requeridas

Mantener en `local.settings.json`:
```json
{
  "FOOTBALL_DATA_API_KEY": "your_api_key_here",
  "CosmosDbConnectionString": "your_connection_string"
}
```

### 3. Dependencias Inyectadas

```csharp
public ScheduledFetchMatchesFunction(
    IFootballDataService footballDataService,
    IMatchRepository matchRepository,
    ILogger<ScheduledFetchMatchesFunction> logger)
```

---

## Monitoreo

### Logs en Azure

Buscar por:
- `ScheduledFetchMatches triggered`
- `ScheduledFetchResults triggered`
- Errores con `Error in Scheduled`

### Métricas a Monitorear

1. **Tiempo de ejecución**: ¿Cuánto tarda cada invocación?
2. **Frecuencia de cambios**: ¿Cuántos partidos se actualizan?
3. **Errores**: ¿Fallan conexiones a Football-Data.org?
4. **Consumo API**: ¿Cuántos requests reales se ejecutan?

### Alertas Recomendadas

```
- Si ScheduledFetchMatches falla 3 veces consecutivas
- Si requests diarios superan 90 (proximidad al límite)
- Si ScheduledFetchResults tiene latencia > 1 minuto
```

---

## Pruebas Locales

### Modificar Timer para Testing

**Cambiar a cada 1 minuto**:
```csharp
[TimerTrigger("*/1 * * * *")] // Cada minuto
```

**Ejecutar en local**:
```bash
func start
```

**Ver logs**:
```
[4/5/2026 10:23:45 AM] ScheduledFetchMatches triggered at 04/05/2026 10:23:45 AM
[4/5/2026 10:23:47 AM] Found 64 total matches, 0 upcoming in next 7 days
```

---

## Optimizaciones Futuras

1. **Caché en Redis**: Evitar llamadas innecesarias si no hay cambios
2. **Batch Processing**: Procesar resultados en paralelo
3. **Predicción de fin de partido**: Usar duración histórica para reducir requests
4. **Late-binding de cambios**: Solo actualizar cuando hay cambios reales

---

## Notas Importantes

- ⚠️ **Timezone**: Timer triggers usan UTC por defecto
- ✅ **Confiabilidad**: Azure Functions reintenta automáticamente en caso de fallo
- 📊 **Escalado**: Las funciones pueden ejecutarse múltiples veces si hay retrasos
- 🔒 **Seguridad**: API Key almacenada en Key Vault en producción

---

## Última Actualización

2026-04-05

**Version**: 1.0.0
