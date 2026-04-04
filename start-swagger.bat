@echo off
echo.
echo ========================================
echo  World Cup 2026 API - Iniciando...
echo ========================================
echo.

cd api

echo Compilando proyecto...
dotnet build --nologo

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Fallo la compilacion
    pause
    exit /b 1
)

echo.
echo ========================================
echo  API corriendo en: http://localhost:7071
echo ========================================
echo.
echo  Swagger UI:    http://localhost:7071/api/swagger/ui
echo  OpenAPI JSON:  http://localhost:7071/api/openapi/v3.json
echo ========================================
echo.
echo Presiona Ctrl+C para detener
echo.

func start

cd ..
