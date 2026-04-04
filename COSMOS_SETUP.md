# Configuración de Cosmos DB

## Opción 1: Cosmos DB Emulator (Desarrollo Local) ✅ RECOMENDADO

El emulador de Cosmos DB te permite desarrollar localmente sin costo.

### Instalación

1. **Descargar el emulador**:
   ```
   https://aka.ms/cosmosdb-emulator
   ```

2. **Instalar** el archivo `.msi` descargado

3. **Iniciar el emulador**:
   - Busca "Azure Cosmos DB Emulator" en el menú inicio
   - O ejecuta: `C:\Program Files\Azure Cosmos DB Emulator\CosmosDB.Emulator.exe`

4. **Verificar**:
   - El emulador abrirá una ventana del navegador en: `https://localhost:8081/_explorer/index.html`
   - Certificado SSL autofirmado (es normal ver advertencia de seguridad)

### Configuración en el Proyecto

El archivo `local.settings.json` ya está configurado con los valores del emulador:

```json
{
  "CosmosEndpointUri": "https://localhost:8081",
  "CosmosPrimaryKey": "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw=="
}
```

**Nota**: Esta clave es pública y está documentada por Microsoft para el emulador local.

### Iniciar la Aplicación

```powershell
cd api
func start
```

La aplicación automáticamente:
1. ✅ Se conecta al emulador en `https://localhost:8081`
2. ✅ Crea la base de datos `worldcup-db` si no existe
3. ✅ Crea los contenedores: `matches`, `predictions`, `scores`
4. ✅ Muestra el mensaje: "✅ Cosmos DB initialized successfully"

### Ver los Datos

1. Abre el Data Explorer: `https://localhost:8081/_explorer/index.html`
2. Navega a: `worldcup-db` → contenedores
3. Puedes ver, agregar, editar y eliminar documentos

---

## Opción 2: Azure Cosmos DB (Producción)

Para usar Cosmos DB en la nube de Azure:

### 1. Crear Cuenta de Cosmos DB

```powershell
# Crear grupo de recursos
az group create --name worldcup-rg --location eastus

# Crear cuenta Cosmos DB
az cosmosdb create \
  --name worldcup-cosmos \
  --resource-group worldcup-rg \
  --default-consistency-level Session \
  --locations regionName=eastus failoverPriority=0
```

### 2. Obtener Credenciales

```powershell
# Endpoint URI
az cosmosdb show --name worldcup-cosmos --resource-group worldcup-rg --query documentEndpoint -o tsv

# Primary Key
az cosmosdb keys list --name worldcup-cosmos --resource-group worldcup-rg --query primaryMasterKey -o tsv
```

### 3. Configurar local.settings.json

Reemplaza los valores en `local.settings.json`:

```json
{
  "CosmosEndpointUri": "https://worldcup-cosmos.documents.azure.com:443/",
  "CosmosPrimaryKey": "tu-primary-key-aqui"
}
```

**⚠️ IMPORTANTE**: Nunca hagas commit de `local.settings.json` con credenciales reales. El archivo ya está en `.gitignore`.

### 4. Configurar en Azure (Producción)

Para la aplicación en Azure Static Web Apps:

```powershell
az staticwebapp appsettings set \
  --name worldcup-app \
  --setting-names \
    CosmosEndpointUri="https://worldcup-cosmos.documents.azure.com:443/" \
    CosmosPrimaryKey="tu-primary-key"
```

O usa Azure Key Vault:

```json
{
  "CosmosEndpointUri": "@Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/CosmosEndpoint/)",
  "CosmosPrimaryKey": "@Microsoft.KeyVault(SecretUri=https://your-vault.vault.azure.net/secrets/CosmosKey/)"
}
```

---

## Estructura de la Base de Datos

### Database: `worldcup-db`

#### Container: `matches`
- **Partition Key**: `/id`
- **Documentos**: Partidos del mundial
- **Ejemplo**:
  ```json
  {
    "id": "match-1",
    "tournamentId": "worldcup-2026",
    "homeTeam": "México",
    "awayTeam": "Argentina",
    "kickoffAtUtc": "2026-06-15T18:00:00Z",
    "stage": "GROUP_STAGE",
    "status": "SCHEDULED",
    "homeScoreFinal": null,
    "awayScoreFinal": null
  }
  ```

#### Container: `predictions`
- **Partition Key**: `/id`
- **Documentos**: Pronósticos de usuarios
- **Ejemplo**:
  ```json
  {
    "id": "pred-123",
    "userId": "user-abc",
    "matchId": "match-1",
    "homeScorePred": 2,
    "awayScorePred": 1,
    "createdAtUtc": "2026-01-12T10:00:00Z",
    "updatedAtUtc": "2026-01-12T10:30:00Z",
    "pointsAwarded": null
  }
  ```

#### Container: `scores`
- **Partition Key**: `/userId`
- **Documentos**: Rankings de usuarios
- **Ejemplo**:
  ```json
  {
    "userId": "user-abc",
    "displayName": "Juan Pérez",
    "totalPoints": 45,
    "totalPredictions": 20,
    "exactScores": 5,
    "correctWinners": 10,
    "rank": 1
  }
  ```

---

## Throughput y Costos

### Emulador Local
- ✅ **Gratis**
- ✅ Sin límites de throughput
- ✅ Ideal para desarrollo

### Azure Cosmos DB
- **Throughput**: 400 RU/s compartido (configurado en el código)
- **Costo estimado**: ~$24 USD/mes para throughput compartido
- **Free Tier**: Primera cuenta tiene 1000 RU/s y 25 GB gratis

---

## Troubleshooting

### Error: "The SSL connection could not be established"

**Problema**: El emulador usa certificado autofirmado

**Solución**:
1. Abre el emulador: `https://localhost:8081/_explorer/index.html`
2. Acepta el certificado en el navegador
3. O deshabilita validación SSL (solo en desarrollo):

```csharp
// En Program.cs (NO para producción)
var handler = new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
};
```

### Error: "Unable to connect to Cosmos DB"

**Verifica**:
1. ✅ Emulador está corriendo
2. ✅ `local.settings.json` tiene los valores correctos
3. ✅ Puerto 8081 está libre

### El emulador no inicia

**Posibles causas**:
- Puerto 8081 ocupado → Cierra otras apps
- Servicio Windows no está corriendo → Reinicia el servicio "Azure Cosmos DB Emulator"

---

## Comandos Útiles

### Limpiar datos del emulador
```powershell
# Reinicia el emulador con datos limpios
C:\Program Files\Azure Cosmos DB Emulator\CosmosDB.Emulator.exe /Shutdown
C:\Program Files\Azure Cosmos DB Emulator\CosmosDB.Emulator.exe /ClearData
```

### Ver logs
```powershell
# Los logs del emulador están en:
%LOCALAPPDATA%\CosmosDBEmulator\cosmosdb.log
```

### Verificar conectividad
```powershell
# Desde el proyecto
cd api
dotnet run

# Verás el mensaje:
# ✅ Cosmos DB initialized successfully
```
