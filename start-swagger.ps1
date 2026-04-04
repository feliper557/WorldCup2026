# Script rápido para iniciar la API con Swagger
Write-Host ""
Write-Host "========================================"
Write-Host " World Cup 2026 API - Iniciando..." -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

Push-Location api

Write-Host "Compilando proyecto..." -ForegroundColor Yellow
dotnet build --nologo

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Falló la compilación" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " API corriendo en: http://localhost:7071" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Swagger UI:    http://localhost:7071/api/swagger/ui" -ForegroundColor Cyan
Write-Host " OpenAPI JSON:  http://localhost:7071/api/openapi/v3.json" -ForegroundColor Cyan
Write-Host " OpenAPI YAML:  http://localhost:7071/api/openapi/v3.yaml" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

func start

Pop-Location
