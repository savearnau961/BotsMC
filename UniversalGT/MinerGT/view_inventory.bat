@echo off
title Monitor de Inventario - Mineflayer Bot

:: Comprobar si Node.js está instalado
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js no esta instalado. Instalalo primero.
    pause
    exit /b
)

:: Verificar que el script JS existe
if not exist view_inventory.js (
    echo ❌ No se encontro view_inventory.js en esta carpeta
    pause
    exit /b
)

:: Abrir terminal y ejecutar monitor de inventario
start "Inventario Bot" cmd /k "node view_inventory.js"
