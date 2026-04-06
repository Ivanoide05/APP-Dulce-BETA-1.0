@echo off
title 🍞 SISTEMA DULCE Y JALEO
echo  🔄 1. SINCRONIZANDO (Buscando novedades de Ivan)...
git pull origin master
echo.
echo  🚀 2. ARRANCANDO SERVIDOR...
cd /d "%~dp0"
echo  Abre el navegador en: http://localhost:3001
echo.
start "" "http://localhost:3001"
node backend/server.js
pause
