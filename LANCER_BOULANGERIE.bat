@echo off
chcp 65001 > nul
title BOULANGERIE DE BABI - SERVEUR LOCAL TEMPS REEL
color 0E

echo ================================================================
echo    🥐 BOULANGERIE DE BABI - DEMARRAGE DU SYSTEME 🥐
echo ================================================================
echo.
echo [1/2] Lancement du serveur Node.js sur le port 5000...
echo.

cd /d "%~dp0"

:: Ouvrir la boutique et le cockpit admin dans le navigateur par defaut
start "" http://localhost:5000
start "" http://localhost:5000/caissiere.html
start "" http://localhost:5000/admin.html

echo [2/2] Liens disponibles pour votre presentation :
echo ----------------------------------------------------------------
echo   * Boutique Client     : http://localhost:5000
echo   * Catalogue Produits  : http://localhost:5000/produits.html
echo   * Caisse Tactile POS  : http://localhost:5000/caissiere.html
echo   * Portail Gerante     : http://localhost:5000/gerante.html
echo   * Cockpit Direction   : http://localhost:5000/admin.html
echo.
echo   * Sur Mobile/Tablette : http://192.168.1.12:5000/app
echo ----------------------------------------------------------------
echo.
echo Ne fermez pas cette fenetre pendant votre demonstration !
echo.

node server.js
pause
