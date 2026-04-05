# Azure Functions Timer - Scheduled Fetch

Este proyecto contiene las funciones con **Timer Triggers** que se ejecutan automáticamente:

- **ScheduledFetchSmartMatches** - Diariamente a las 3 AM UTC
- **ScheduledFetchSmartResults** - Cada 5 minutos

## 📋 Requisitos

- .NET 8.0 SDK
- Azure CLI
- Cuenta de Azure

## 🚀 Deployment

### Paso 1: Crear Azure Functions App en Azure Portal

```bash
# Desde Azure Portal:
1. Crear recurso "Function App"
2. Nombre: mundial-functions-timer (o el que prefieras)
3. Runtime: .NET 8 (Isolated)
4. Plan: Consumption (más barato)
5. Storage Account: Crear nueva
```

### Paso 2: Publicar desde Visual Studio

```bash
# Opción A: Desde Visual Studio
1. Click derecho en proyecto "api-timer"
2. "Publish" → Seleccionar Azure Functions
3. Elegir la Function App creada
4. Publish

# Opción B: Desde línea de comandos
cd api-timer
dotnet publish -c Release
```

### Paso 3: Configurar variables de entorno

En Azure Portal, ir a tu Function App:

```
Settings → Configuration → Application settings

Agregar:
- SqlConnectionString: tu connection string a BD
- FOOTBALL_DATA_API_KEY: tu API key de Football-Data.org
```

### Paso 4: Verificar conexión a BD

Las funciones necesitan acceso a la BD. Asegúrate que:

1. Firewall de SQL Server permite IP de Azure Functions
2. Connection string es correcta
3. Base de datos existe y está poblada

## 📊 Monitoreo

Ver logs en Azure Portal:

```
Monitor → Logs → Seleccionar tu Function App
```

O desde Azure CLI:

```bash
az functionapp log tail --name mundial-functions-timer --resource-group tu-grupo
```

## 🔍 Testing Local

Para probar localmente:

```bash
cd api-timer

# Instalar Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Configurar local.settings.json con tu connection string

# Ejecutar localmente
func start
```

## 📝 Arquitectura

```
Static Web Apps (Frontend + HTTP APIs)
     ↓
Azure Functions App (Timer Triggers)
     ↓
Base de Datos SQL
```

- **Static Web Apps**: Deploy con GitHub Actions
- **Functions App**: Deploy con Azure Portal o Visual Studio

## ⚠️ Costos

- **Consumption Plan**: ~$0.20/mes para Timer Triggers
- **Storage**: ~$0.50/mes
- **Total**: ~$1/mes aprox.

## 🆘 Troubleshooting

**Error: "Connection timeout"**
- Verificar SQL Server firewall
- Verificar connection string

**Error: "Invalid trigger"**
- Asegúrate que usaste .NET 8 Isolated runtime
- Verificar que Microsoft.Azure.Functions.Worker.Extensions.Timer está instalado

**No se ejecutan las funciones**
- Revisar logs en Azure Portal
- Verificar que la Function App está "Running"
- Esperar 5-10 minutos (puede tomar tiempo inicialmente)

## 📞 Soporte

Para más info sobre Azure Functions Timer Triggers:
https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer
