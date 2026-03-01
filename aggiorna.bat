@echo off
echo Sto preparando i file...
git add .
set /p msg="Cosa hai cambiato? "
git commit -m "%msg%"
echo.
echo Invio su GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] Qualcosa e andato storto durante il caricamento.
) else (
    echo.
    echo [OK] Sito aggiornato con successo!
)
pause