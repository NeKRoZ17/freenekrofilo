@echo off
echo Sto preparando i file...
git add .
git commit -m "fix"
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