@echo off
chcp 65001 > nul
title BOULANGERIE DE BABI - SERVEUR LOCAL TEMPS REEL
color 0E

echo ================================================================
echo    🥖 BOULANGERIE DE BABI - DEMARRAGE DU SYSTEME 🥖
echo ================================================================
echo.
echo [1/2] Lancement du serveur Node.js sur le port 5000...
echo.

cd /d "%~dp0"

:: Ouvrir automatiquement les interfaces après 1 seconde pour garantir la connexion immédiate
start /b "" powershell -Command "Start-Sleep -Seconds 1; Start-Process 'http://localhost:5000'"

echo [2/2] Liens disponibles pour votre presentation :
echo ----------------------------------------------------------------
echo   * 🏪 Boutique Client     : http://localhost:5000
echo   * 💻 Espace Caissiere    : http://localhost:5000/caissiere.html
echo   * 👩 Espace Gerante      : http://localhost:5000/gerante.html
echo   * 👔 Espace Administrateur : http://localhost:5000/admin.html
echo.
echo   * Sur Mobile/Tablette    : http://192.168.1.12:5000/app
echo ----------------------------------------------------------------
echo.
echo Ne fermez pas cette fenetre pendant votre demonstration !
echo.

node server.js
pause
