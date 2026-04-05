@echo off
echo ============================================
echo [!] SINCRONIZANDO STAGE -> PRODUCTO (PUBLIC)
echo ============================================
xcopy /Y /S /E "stage\*" "public\"
echo.
echo [OK] Archivos pasados a la carpeta PUBLIC. 
echo [!] Ahora sube la carpeta PUBLIC a Netlify.
pause
