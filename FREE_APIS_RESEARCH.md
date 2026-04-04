# APIs Gratuitas de Fútbol - Investigación

## 🏆 Recomendación Principal: API-Football (API-Sports)

### ✅ Ventajas
- **100% GRATUITO** - Plan free permanente sin tarjeta de crédito
- **100 requests/día** en plan gratuito
- **Cobertura completa**: +1,200 ligas y copas
- Incluye Mundial 2026
- Actualización cada 15 segundos en vivo

### 📊 Datos Disponibles (Plan Gratuito)
- ✅ Países y temporadas
- ✅ Ligas y standings (tablas de posiciones)
- ✅ Equipos
- ✅ **Livescore** (marcadores en vivo)
- ✅ **Fixtures** (partidos programados)
- ✅ **Head to Head** (historial entre equipos)
- ✅ Eventos del partido
- ✅ Alineaciones (Line Ups)
- ✅ Máximos goleadores
- ✅ Jugadores y entrenadores
- ✅ Transferencias
- ✅ Trofeos
- ✅ Lesionados
- ✅ Cuotas (Odds) pre-partido y en vivo
- ✅ Estadísticas
- ✅ Predicciones

### 🔗 Enlaces
- **Website**: https://www.api-football.com/
- **Documentación**: https://www.api-football.com/documentation-v3
- **Dashboard/Registro**: https://dashboard.api-football.com/register
- **RapidAPI**: https://rapidapi.com/api-sports/api/api-football

### 📝 Cómo Empezar
1. Registrarse en https://dashboard.api-football.com/register (GRATIS, sin tarjeta)
2. Obtener API Key del dashboard
3. La API Key funciona para TODOS sus deportes: Football, Basketball, Baseball, etc.

### 🎯 Endpoints Principales

**Base URL**: `https://v3.football.api-sports.io/`

#### Fixtures (Partidos)
```
GET /fixtures?date=2026-01-15
GET /fixtures?league=39&season=2026
GET /fixtures?team=33&season=2026
GET /fixtures?live=all
```

#### Leagues (Ligas)
```
GET /leagues
GET /leagues?id=1
GET /leagues?country=Spain
```

#### Standings (Tablas de Posiciones)
```
GET /standings?league=39&season=2026
```

#### Teams
```
GET /teams?league=39&season=2026
GET /teams?id=33
```

#### LiveScore
```
GET /fixtures?live=all
GET /fixtures?live=39-140-78
```

### 💡 Límites del Plan Gratuito
- **100 requests/día**
- Todos los endpoints disponibles
- Todas las ligas disponibles
- Datos históricos limitados (solo temporadas recientes)

### 🔄 Si necesitas más requests
- **Pro**: $19/mes - 7,500 requests/día
- **Ultra**: $29/mes - 75,000 requests/día
- **Mega**: $39/mes - 150,000 requests/día

## 🥈 Alternativas Gratuitas

### 2. Football-Data.org
- **URL**: https://www.football-data.org/
- **Plan Free**: 10 requests/minuto
- Cobertura limitada a ligas principales europeas
- No incluye Mundial

### 3. TheSportsDB
- **URL**: https://www.thesportsdb.com/
- **Patreon**: $3/mes para API completa
- Plan gratuito muy limitado
- Menos actualizado

### 4. Sportradar (No recomendado)
- Trial gratuito por tiempo limitado
- Muy caro después del trial
- Más orientado a empresas

## 🎯 Recomendación Final

**Usar API-Football (API-Sports)** porque:
1. ✅ Es COMPLETAMENTE GRATUITO
2. ✅ 100 requests/día es suficiente para un proyecto personal/demo
3. ✅ Incluye Mundial 2026 y todas las ligas
4. ✅ Datos en tiempo real cada 15 segundos
5. ✅ Documentación excelente
6. ✅ Fácil integración
7. ✅ Sin tarjeta de crédito requerida

### 📊 Ejemplo de Implementación

Con 100 requests/día puedes:
- Consultar fixtures del día: 1 request
- Obtener standings de 5 ligas: 5 requests
- Livescore cada hora: 24 requests
- Consultas de equipos/jugadores: 70 requests disponibles

**Total estimado**: ~30-40 requests/día para una app básica del Mundial 2026

## 🚀 Próximos Pasos

1. Registrarse en API-Football
2. Obtener API Key
3. Implementar nuevo servicio en la aplicación
4. Reemplazar BeSoccer API con API-Football
5. Actualizar endpoints del backend
