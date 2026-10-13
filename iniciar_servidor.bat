@echo off
setlocal enabledelayedexpansion
title Escuela A.L.O. Arcade - Servidor Local

echo ====================================================================
echo             ESCUELA A.L.O. ARCADE - SERVIDOR PHP LOCAL
echo ====================================================================
echo.

set "PHP_CMD="

REM 1. Probar si php ya esta en el PATH
where php >nul 2>nul
if %errorlevel% equ 0 (
    set "PHP_CMD=php"
    goto found_php
)

REM 2. Buscar en instalacion de WinGet
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
    set "PHP_CMD=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
    set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe;%PATH%"
    goto found_php
)

REM 3. Buscar en XAMPP
if exist "C:\xampp\php\php.exe" (
    set "PHP_CMD=C:\xampp\php\php.exe"
    set "PATH=C:\xampp\php;%PATH%"
    goto found_php
)

REM 4. Buscar en rutas estandar de Windows
if exist "C:\php\php.exe" (
    set "PHP_CMD=C:\php\php.exe"
    set "PATH=C:\php;%PATH%"
    goto found_php
)

REM Si no se encontro ningun PHP
echo [ERROR] No se encontro el ejecutable de PHP.
echo Por favor asegurate de tener PHP o XAMPP instalado.
echo.
pause
exit /b 1

:found_php
echo [OK] PHP detectado: !PHP_CMD!
echo.
echo ====================================================================
echo   Servidor iniciado en: http://localhost:8000
echo   Abriendo tu navegador web...
echo   Para detener el servidor, cierra esta ventana o presiona Ctrl + C
echo ====================================================================
echo.

REM Iniciar el navegador web en segundo plano
start "" http://localhost:8000

REM Iniciar el servidor PHP apuntando a public/ y usando router de soporte
"!PHP_CMD!" -S localhost:8000 index.php
pause
