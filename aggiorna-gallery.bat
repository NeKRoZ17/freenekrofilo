@echo off
REM Script batch per aggiornare gallery-data.js su Windows

echo Aggiornamento foto da cartella "foto adesione"...
node "%~dp0update-gallery.js"

if errorlevel 1 (
    echo.
    echo Errore! Assicurati che Node.js sia installato.
    echo Scarica da: https://nodejs.org/
    pause
) else (
    echo.
    echo Fatto! gallery-data.js e' stato aggiornato.
    pause
)
