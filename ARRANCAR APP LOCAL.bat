@echo off
echo.
echo  ====================================
echo   DULCE Y JALEO — Servidor Local
echo  ====================================
echo.
echo  Instalando dependencias...
cd /d "%~dp0"
call npm install --silent 2>nul
echo.
echo  Iniciando servidor...
echo  Abre el navegador en: http://localhost:3001
echo.
start "" "http://localhost:3001"
node backend/server.js
pause
