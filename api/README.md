# WorldCup 2026 API - Backend Documentation

## Descripción General

API backend para la aplicación WorldCup 2026. Proporciona endpoints para obtener información de partidos del Mundial 2026 y de principales ligas de fútbol.

## Stack Tecnológico

- **Framework**: Azure Functions (.NET 8)
- **Lenguaje**: C#
- **API Externa**: Football-Data.org
- **Base de Datos**: Azure Cosmos DB (opcional)
- **Puerto**: 7071 (local)

## Configuración Inicial

### Requisitos
- .NET 8 SDK
- Azure Functions Core Tools v4.2.2+
- API Key de Football-Data.org (gratuita)

### Variables de Entorno

Configurar en `api/local.settings.json`:

```json
{
    "Values": {
        "FOOTBALL_DATA_API_KEY": "16adbf9e6c97444b878dfa6b5ddacfbf",
        "CosmosEndpointUri": "https://localhost:8081",
        "CosmosPrimaryKey": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
    }
}
```

### Obtener API Key

1. Visitar: https://www.football-data.org/client/register
2. Registrarse gratuitamente
3. Copiar el token
4. Guardar en `local.settings.json`

## Estructura del Proyecto

```
api/
├── Functions/
│   ├── FootballDataFunction.cs       # Endpoints de fútbol
│   ├── MatchesFunction.cs            # Endpoints de partidos
│   └── PredictionsFunction.cs        # Endpoints de predicciones
├── Services/
│   ├── FootballDataService.cs        # Servicio de API Football-Data.org
│   ├── ScoringService.cs             # Cálculo de puntuaciones
│   └── TimeProviderService.cs        # Servicio de tiempo
├── Infrastructure/
│   ├── Repositories/                 # Acceso a datos
│   ├── CosmosContext.cs              # Contexto de BD
│   └── CosmosDbInitializer.cs        # Inicialización de BD
├── Models/
│   ├── Match.cs                      # Modelo de partido
│   ├── Prediction.cs                 # Modelo de predicción
│   ├── Score.cs                      # Modelo de puntuación
│   └── UserProfile.cs                # Modelo de usuario
└── Program.cs                        # Configuración e inyección de dependencias
```

## Flujo de Datos

```
Cliente HTTP
    ↓
Azure Functions (Endpoint)
    ↓
FootballDataService
    ↓
API Football-Data.org
    ↓
Mapeo a modelos internos
    ↓
Respuesta JSON
```

## Iniciar el Backend

### Desde Terminal

```bash
cd api
func start
```

### Usando PowerShell

```powershell
.\run-api.ps1
```

El servidor estará disponible en: `http://localhost:7071`

## Endpoints Disponibles

Ver [FUNCTIONS.md](FUNCTIONS.md) para la documentación completa de endpoints.

### Resumen Rápido

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/footballdata/fixtures` | Todos los partidos del Mundial 2026 |
| GET | `/api/footballdata/laliga` | Todos los partidos de La Liga |
| GET | `/api/footballdata/laliga/results` | Resultados finalizados de La Liga |
| GET | `/api/footballdata/results` | Resultados del Mundial |
| GET | `/api/footballdata/live` | Partidos en vivo |
| GET | `/api/footballdata/upcoming` | Próximos partidos |
| GET | `/api/footballdata/match/{matchId}` | Detalles de un partido |
| GET | `/api/matches` | Todos los partidos (BD local) |
| POST | `/api/predictions` | Crear una predicción |
| GET | `/api/swagger/ui` | Documentación Swagger |

## Modelos de Datos

### Match
```csharp
{
    "id": "537327",
    "tournamentId": "wc-2026",
    "homeTeam": "Mexico",
    "awayTeam": "South Africa",
    "kickoffAtUtc": "2026-06-11T19:00:00Z",
    "stage": "GROUP_STAGE",
    "status": "SCHEDULED|LIVE|FINISHED",
    "homeScoreFinal": 1,
    "awayScoreFinal": 0
}
```

## Servicios Principales

### FootballDataService
- Obtiene datos de la API Football-Data.org
- Mapea respuestas a modelos internos
- Manejo de errores y timeouts

### TimeProviderService
- Proporciona hora UTC consistente
- Facilita testing

### ScoringService
- Calcula puntuaciones de predicciones
- Compara resultados reales vs predicciones

## Base de Datos (Cosmos DB)

### Contenedores
- `matches`: Partidos guardados localmente
- `predictions`: Predicciones de usuarios
- `scores`: Puntuaciones/resultados

### Configuración

Usar emulador local o instancia en Azure:
```json
"CosmosEndpointUri": "https://YOUR_ACCOUNT.documents.azure.com:443/",
"CosmosPrimaryKey": "YOUR_PRIMARY_KEY_HERE"
```

## Autenticación

**Estado Actual**: Sin autenticación (Anonymous)

**Próximas Implementaciones**:
- [ ] JWT Bearer Tokens
- [ ] Registro de usuarios
- [ ] Login
- [ ] Refresh tokens
- [ ] Roles y permisos

Ver sección "Próximas Funcionalidades" en FUNCTIONS.md

## Testing

### Swagger UI

Acceder a: `http://localhost:7071/api/swagger/ui`

Permite probar todos los endpoints interactivamente.

### Con cURL

```bash
# Obtener todos los partidos de La Liga
curl -X GET "http://localhost:7071/api/footballdata/laliga"

# Obtener resultados de La Liga
curl -X GET "http://localhost:7071/api/footballdata/laliga/results"

# Obtener partido específico
curl -X GET "http://localhost:7071/api/footballdata/match/537327"
```

### Con Postman

Importar desde Swagger:
1. Ir a `http://localhost:7071/api/openapi/v3.json`
2. En Postman: File → Import from Link
3. Pegar la URL anterior

## Manejo de Errores

### Códigos de Respuesta

| Código | Significado |
|--------|------------|
| 200 | OK - Éxito |
| 400 | Bad Request - Parámetros inválidos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

### Formato de Error

```json
{
    "error": "Descripción del error"
}
```

## Limitaciones de API

**Football-Data.org (Plan Gratuito)**:
- 10 requests por minuto
- Sin datos de Liga Colombiana
- Datos históricos disponibles

**Ligas Disponibles**:
- 🌍 FIFA World Cup 2026
- 🇪🇸 La Liga - Primera División España
- 🇬🇧 Premier League (Inglaterra)
- 🇮🇹 Serie A (Italia)
- 🇫🇷 Ligue 1 (Francia)
- 🇩🇪 Bundesliga (Alemania)
- 🇧🇷 Campeonato Brasileiro
- Y más...

## Performance

### Optimizaciones Implementadas
- Caché de respuestas
- Compilación Release
- Inyección de dependencias
- Async/await para operaciones IO

### Métricas Esperadas
- Respuesta promedio: < 2 segundos
- Throughput: 10+ requests/segundo

## Autenticación (En Construcción)

Sistema de registro seguro con invitaciones:
- ✅ Encriptación AES-256 de tokens
- ✅ Invitaciones válidas por 28 horas
- ✅ One-time use (un token = un registro)
- ⏳ JWT tokens (próximo)
- ⏳ Refresh tokens (próximo)

Ver [REGISTRATION_FLOW.md](REGISTRATION_FLOW.md) para detalles completos.

## Próximas Funcionalidades

1. **Endpoints de Autenticación**
   - POST /api/auth/register
   - POST /api/auth/login
   - GET /api/auth/profile
   - POST /api/admin/invitations

2. **Perfil de Usuario**
   - Datos personales
   - Historial de predicciones
   - Estadísticas

3. **Predicciones Avanzadas**
   - Historial de predicciones
   - Validación con resultados reales
   - Leaderboard global

4. **Notificaciones**
   - Email de resultados
   - Push notifications
   - Alertas de partidos próximos

5. **Datos Adicionales**
   - Estadísticas de equipos
   - Información de jugadores
   - Históricos de temporadas

## Desarrollo

### Agregar un Nuevo Endpoint

1. Crear método en `Services/FootballDataService.cs`
2. Agregar función en `Functions/FootballDataFunction.cs`
3. Decorar con atributos OpenAPI
4. Compilar y reiniciar

### Versioning

Mantener compatibilidad con versiones anteriores. Los cambios breaking deben versionarse.

## Troubleshooting

### Backend no inicia
```bash
# Verificar puerto en uso
netstat -ano | grep 7071

# Matar proceso
taskkill /F /PID <PID>

# Reintentar
func start
```

### API Key inválida
```
Error: FOOTBALL_DATA_API_KEY not set
```
→ Verificar `local.settings.json`

### Timeout de API
→ Esperar 1 minuto (limite de 10 req/min)

## Referencias

- [Football-Data.org API Docs](https://docs.football-data.org/)
- [Azure Functions Documentation](https://docs.microsoft.com/en-us/azure/azure-functions/)
- [Cosmos DB Documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/)

## Licencia

MIT License - Ver LICENSE.md

## Contacto

Para preguntas o reportar bugs, crear issue en el repositorio.

---

**Última actualización**: 2026-03-31
**Versión API**: 1.0.0
