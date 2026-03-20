@echo off
:menu
cls
echo =============================================
echo       MINECRAFT BOT CONTROL
echo =============================================
echo 1 - Iniciar bot
echo 2 - Desconectar bot
echo 3 - Reconectar bot
echo =============================================
set /p choice=Ingresa opcion (1-3): 

REM --- OPCION 1: Iniciar bot ---
if "%choice%"=="1" (
    echo Iniciando bot...
    start cmd /k node bot.js MinerGT
    timeout /t 1 /nobreak >nul
    goto menu
)

REM --- OPCION 2: Desconectar bot ---
if "%choice%"=="2" (
    echo Desconectando bot...
    taskkill /IM node.exe /F >nul 2>&1
    timeout /t 1 /nobreak >nul
    goto menu
)

REM --- OPCION 3: Reconectar bot ---
if "%choice%"=="3" (
    echo Reconectando bot...
    taskkill /IM node.exe /F >nul 2>&1
    timeout /t 1 /nobreak >nul
    start cmd /k node bot.js MinerGT
    goto menu
)

echo Opcion invalida. Solo 1-3.
timeout /t 2 /nobreak >nul
goto menu