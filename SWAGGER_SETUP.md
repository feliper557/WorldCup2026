# Configuración de Swagger/OpenAPI para World Cup 2026 API

## ✅ Instalación Completada

Se ha agregado el paquete **Microsoft.Azure.Functions.Worker.Extensions.OpenApi** al proyecto, que proporciona soporte completo para Swagger/OpenAPI en Azure Functions.

## 📝 Documentación Agregada

Todos los endpoints han sido documentados con atributos OpenAPI:

### Matches Function
- **GET /api/matches** - Obtener partidos próximos

### Predictions Function
- **POST /api/predictions** - Crear o actualizar predicción

### API Football Function
- **GET /api/football/fixtures** - Obtener partidos con filtros
- **GET /api/football/fixtures/live** - Obtener partidos en vivo
- **GET /api/football/fixtures/date/{date}** - Obtener partidos por fecha
- **GET /api/football/standings** - Obtener tabla de posiciones
- **GET /api/football/leagues** - Obtener ligas disponibles

## 🚀 Cómo Iniciar la API con Swagger

### Opción 1: Usar el script start.ps1
```powershell
.\start.ps1
```

### Opción 2: Manual
```powershell
cd api
func start
```

### Opción 3: Desde Visual Studio Code
1. Presiona F5 o abre el panel Debug
2. Selecciona "Attach to .NET Functions"

## 🌐 Acceder a Swagger UI

Una vez que la API esté corriendo, accede a Swagger en:

### Endpoints de Swagger/OpenAPI:
- **Swagger UI**: `http://localhost:7071/api/swagger/ui`
- **OpenAPI JSON**: `http://localhost:7071/api/openapi/v3.json`
- **OpenAPI YAML**: `http://localhost:7071/api/openapi/v3.yaml`

## 📖 Uso de Swagger UI

1. **Ver todos los endpoints**: La interfaz muestra todos los endpoints agrupados por tags (Matches, Predictions, API-Football)

2. **Probar un endpoint**:
   - Haz clic en el endpoint que quieres probar
   - Haz clic en "Try it out"
   - Completa los parámetros requeridos
   - Haz clic en "Execute"
   - Verás la respuesta completa con código de estado, headers y body

3. **Ver esquemas de datos**: En la parte inferior de Swagger UI puedes ver todos los modelos de datos (Match, Prediction, Score, etc.)

## 🔧 Características de la Documentación

Cada endpoint incluye:
- ✅ Descripción clara del propósito
- ✅ Parámetros requeridos y opcionales
- ✅ Tipos de datos de request y response
- ✅ Códigos de estado HTTP posibles
- ✅ Ejemplos de schemas

## 🎨 Personalización

Si necesitas personalizar la configuración de OpenAPI, puedes modificar los atributos en cada función:

```csharp
[OpenApiOperation(
    operationId: "NombreOperacion",
    tags: new[] { "Tag" },
    Summary = "Resumen corto",
    Description = "Descripción detallada",
    Visibility = OpenApiVisibilityType.Important)]
```

## 🐛 Solución de Problemas

### El servidor no inicia
1. Verifica que el puerto 7071 esté libre:
   ```powershell
   netstat -ano | findstr :7071
   ```

2. Si está ocupado, mata el proceso:
   ```powershell
   taskkill /PID <PID> /F
   ```

### Swagger UI no carga
1. Asegúrate de que la API esté corriendo (verifica la consola)
2. Verifica que puedas acceder a: `http://localhost:7071/api/openapi/v3.json`
3. Si el JSON carga pero no la UI, limpia el cache del navegador

### Errores 500 en los endpoints
1. Verifica que Cosmos DB Emulator esté corriendo
2. Revisa la configuración en `local.settings.json`
3. Consulta los logs en la terminal donde corre `func start`

## 📚 Documentación Adicional

- [Azure Functions OpenAPI Extension](https://github.com/Azure/azure-functions-openapi-extension)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Azure Functions Worker Extensions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-dotnet-class-library)

## 🎯 Próximos Pasos

1. ✅ Iniciar la API: `cd api && func start`
2. ✅ Abrir Swagger UI: http://localhost:7071/api/swagger/ui
3. ✅ Probar los endpoints desde la interfaz
4. ✅ Verificar las respuestas y schemas

¡Ahora puedes documentar, probar y explorar tu API de manera interactiva! 🎉
