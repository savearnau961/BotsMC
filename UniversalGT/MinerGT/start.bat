@echo off
title Mineflayer Bot Manager

:: Ruta del bot JS
set BOT_FILE=bot.js
set INV_BAT=inv_bot.bat

:: Variables de control
set /a RUNNING=0

:MENU
cls
echo ================================
echo      Mineflayer Bot Manager
echo ================================
echo.
echo 1. Conectar bot
echo 2. Vaciar inventario
echo 3. Desconectar bot
echo 4. Ver inventario en tiempo real
echo 5. Salir
echo.
set /p choice=Selecciona una opcion:

if "%choice%"=="1" goto START_BOT
if "%choice%"=="2" goto CLEAR_INV
if "%choice%"=="3" goto STOP_BOT
if "%choice%"=="4" goto VIEW_INV
if "%choice%"=="5" exit
goto MENU

:START_BOT
if %RUNNING%==1 (
    echo El bot ya esta corriendo.
    pause
    goto MENU
)
start "Mineflayer Bot" cmd /k "node %BOT_FILE%"
set /a RUNNING=1
echo Bot iniciado.
pause
goto MENU

:CLEAR_INV
if %RUNNING%==0 (
    echo El bot no esta corriendo.
    pause
    goto MENU
)
echo Enviando comando de vaciado de inventario...
:: Para vaciar inventario, el bot debe leer un archivo de comandos (bot_commands.txt)
echo clearinv > bot_commands.txt
pause
goto MENU

:STOP_BOT
if %RUNNING%==0 (
    echo El bot no esta corriendo.
    pause
    goto MENU
)
tasklist /FI "IMAGENAME eq node.exe" | find /I "%BOT_FILE%" >nul
if %ERRORLEVEL%==0 (
    taskkill /F /IM node.exe
    echo Bot detenido.
) else (
    echo No se encontro el bot corriendo.
)
set /a RUNNING=0
pause
goto MENU

:VIEW_INV
if %RUNNING%==0 (
    echo El bot no esta corriendo.
    pause
    goto MENU
)
start "Inventario Bot" cmd /k "%INV_BAT%"
goto MENU
