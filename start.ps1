# Script para iniciar el proyecto World Cup 2026

Write-Host "🌍 World Cup 2026 Predictor - Startup Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$apiPath = Join-Path $PSScriptRoot "api"
if (-not (Test-Path $apiPath)) {
    Write-Host "❌ Error: No se encuentra la carpeta 'api'" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

# Verificar si el emulador de Cosmos DB está corriendo
Write-Host "🔍 Verificando Cosmos DB Emulator..." -ForegroundColor Yellow

$cosmosProcess = Get-Process -Name "Microsoft.Azure.Cosmos.Emulator" -ErrorAction SilentlyContinue

if ($null -eq $cosmosProcess) {
    Write-Host "⚠️  Cosmos DB Emulator no está corriendo" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "  1. Iniciar Cosmos DB Emulator manualmente desde el menú inicio" -ForegroundColor White
    Write-Host "  2. Ejecutar: Start-Process 'C:\Program Files\Azure Cosmos DB Emulator\CosmosDB.Emulator.exe'" -ForegroundColor White
    Write-Host "  3. Continuar sin el emulador (las operaciones de BD fallarán)" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "¿Intentar iniciar el emulador? (S/N)"
    
    if ($response -eq "S" -or $response -eq "s") {
        $emulatorPath = "C:\Program Files\Azure Cosmos DB Emulator\CosmosDB.Emulator.exe"
        
        if (Test-Path $emulatorPath) {
            Write-Host "🚀 Iniciando Cosmos DB Emulator..." -ForegroundColor Green
            Start-Process $emulatorPath
            Write-Host "⏳ Esperando 10 segundos para que el emulador inicie..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
        } else {
            Write-Host "❌ No se encontró el emulador en: $emulatorPath" -ForegroundColor Red
            Write-Host "   Descárgalo de: https://aka.ms/cosmosdb-emulator" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "   Presiona Enter para continuar sin el emulador..." -ForegroundColor White
            Read-Host
        }
    }
} else {
    Write-Host "✅ Cosmos DB Emulator está corriendo" -ForegroundColor Green
}

Write-Host ""
Write-Host "🏗️  Compilando el proyecto..." -ForegroundColor Yellow

Push-Location $apiPath

# Compilar
$buildResult = dotnet build --nologo 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar el proyecto" -ForegroundColor Red
    Write-Host $buildResult
    Pop-Location
    exit 1
}

Write-Host "✅ Compilación exitosa" -ForegroundColor Green
Write-Host ""

# Iniciar Azure Functions
Write-Host "🚀 Iniciando Azure Functions..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📡 Endpoints disponibles:" -ForegroundColor Green
Write-Host "   GET  http://localhost:7071/api/matches" -ForegroundColor White
Write-Host "   POST http://localhost:7071/api/predictions" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Cosmos DB Explorer:" -ForegroundColor Green
Write-Host "   https://localhost:8081/_explorer/index.html" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

func start

Pop-Location
