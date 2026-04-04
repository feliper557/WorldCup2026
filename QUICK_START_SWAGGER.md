# 🎉 Swagger/OpenAPI - Guía Rápida

## ✅ ¿Qué se ha instalado?

- **Microsoft.Azure.Functions.Worker.Extensions.OpenApi** v1.6.0
- Documentación completa de todos los endpoints
- Interfaz Swagger UI interactiva

## 🚀 Inicio Rápido (3 pasos)

### 1️⃣ Iniciar la API
```powershell
.\start-swagger.ps1
```
O simplemente:
```powershell
cd api
func start
```

### 2️⃣ Abrir Swagger UI
Abre tu navegador en:
```
http://localhost:7071/api/swagger/ui
```

### 3️⃣ ¡Probar los endpoints!
En la interfaz Swagger:
1. Expande un endpoint (ej: GET /api/matches)
2. Haz clic en "Try it out"
3. Haz clic en "Execute"
4. ¡Verás la respuesta!

## 📖 URLs Disponibles

| Recurso | URL |
|---------|-----|
| **Swagger UI** (interfaz visual) | http://localhost:7071/api/swagger/ui |
| **OpenAPI JSON** (schema) | http://localhost:7071/api/openapi/v3.json |
| **OpenAPI YAML** (schema) | http://localhost:7071/api/openapi/v3.yaml |

## 🎯 Endpoints Documentados

### ⚽ Matches
- `GET /api/matches` - Obtener partidos próximos

### 🎲 Predictions
- `POST /api/predictions` - Crear/actualizar predicción

### 🌐 API-Football
- `GET /api/football/fixtures` - Obtener fixtures
- `GET /api/football/fixtures/live` - Fixtures en vivo
- `GET /api/football/fixtures/date/{date}` - Fixtures por fecha
- `GET /api/football/standings` - Tabla de posiciones
- `GET /api/football/leagues` - Ligas disponibles

## 💡 Ejemplo de Uso en Swagger UI

### Probar GET /api/matches
1. Ve a Swagger UI: http://localhost:7071/api/swagger/ui
2. Encuentra la sección "Matches"
3. Haz clic en `GET /api/matches`
4. Haz clic en "Try it out"
5. Haz clic en "Execute"
6. ¡Verás la respuesta con los matches!

### Probar POST /api/predictions
1. Encuentra la sección "Predictions"
2. Haz clic en `POST /api/predictions`
3. Haz clic en "Try it out"
4. Edita el JSON del request:
```json
{
  "matchId": "match-1",
  "home": 2,
  "away": 1
}
```
5. Haz clic en "Execute"
6. ¡Verás tu predicción creada!

## 🔧 Características

✅ Documentación automática de todos los endpoints
✅ Interfaz visual para probar la API sin código
✅ Validación de parámetros en tiempo real
✅ Ejemplos de request/response
✅ Esquemas de datos (Models)
✅ Códigos de respuesta HTTP explicados
✅ Agrupación por categorías (tags)

## 📱 Probar desde otras herramientas

### Postman
Importa el schema de OpenAPI:
1. En Postman: Import > Link
2. Pega: http://localhost:7071/api/openapi/v3.json
3. ¡Todos los endpoints se importarán automáticamente!

### cURL
```powershell
# GET request
curl http://localhost:7071/api/matches

# POST request
curl -X POST http://localhost:7071/api/predictions `
  -H "Content-Type: application/json" `
  -H "X-MS-CLIENT-PRINCIPAL-ID: user123" `
  -d '{\"matchId\":\"match-1\",\"home\":2,\"away\":1}'
```

### Fetch (JavaScript)
```javascript
// GET
const response = await fetch('http://localhost:7071/api/matches');
const matches = await response.json();

// POST
const prediction = await fetch('http://localhost:7071/api/predictions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-MS-CLIENT-PRINCIPAL-ID': 'user123'
  },
  body: JSON.stringify({
    matchId: 'match-1',
    home: 2,
    away: 1
  })
});
```

## 🐛 Solución Rápida de Problemas

### ❌ "Cannot GET /api/swagger/ui"
**Solución**: Asegúrate de que la API esté corriendo (`func start`)

### ❌ Puerto 7071 ocupado
**Solución**:
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :7071

# Matar el proceso
taskkill /PID <PID> /F
```

### ❌ Error 500 en endpoints
**Solución**: 
1. Verifica que Cosmos DB Emulator esté corriendo
2. Revisa `local.settings.json`

## 📚 Más Información

- [SWAGGER_SETUP.md](./SWAGGER_SETUP.md) - Documentación completa
- [README.md](./README.md) - Guía general del proyecto

---

**¡Ahora puedes probar tu API visualmente! 🎉**
