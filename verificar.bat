@echo off
setlocal EnableExtensions EnableDelayedExpansion
title ViewportStudio3D - verificacion
cd /d "%~dp0"
set "LOG=%~dp0verificacion.log"
set "NEXT_TELEMETRY_DISABLED=1"

echo.
echo  ViewportStudio3D - instalacion y verificacion de la web
echo  ------------------------------------------------------
echo  Este script: instala Node.js si falta, instala dependencias,
echo  comprueba tipos, lint y compilacion, arranca la web en
echo  http://localhost:3000 y guarda los resultados en verificacion.log
echo  e informes\. Para detenerlo, cierra esta ventana.
echo.

where node >nul 2>&1
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
  ) else (
    echo  Node.js no esta instalado. Se instalara Node.js LTS con winget.
    echo  Windows puede pedirte permiso: acepta para continuar.
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
  )
)

if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" set "CHROME_PATH=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" if not defined CHROME_PATH set "CHROME_PATH=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

:run
taskkill /FI "WINDOWTITLE eq VS3D-servidor*" /T /F >nul 2>&1
if exist informes rmdir /s /q informes
mkdir informes
> "%LOG%" echo ==== ViewportStudio3D verificacion %date% %time% ====
>>"%LOG%" echo [node]
node -v >>"%LOG%" 2>&1
>>"%LOG%" echo [npm]
call npm -v >>"%LOG%" 2>&1

echo  1/6 Instalando dependencias (la primera vez tarda unos minutos)...
>>"%LOG%" echo [install]
call npm install --no-audit --no-fund >>"%LOG%" 2>&1
>>"%LOG%" echo [install-exit] !errorlevel!

echo  2/6 Comprobando tipos...
>>"%LOG%" echo [typecheck]
call npm run typecheck >>"%LOG%" 2>&1
>>"%LOG%" echo [typecheck-exit] !errorlevel!

echo  3/6 Revisando el codigo (lint)...
>>"%LOG%" echo [lint]
call npm run lint >>"%LOG%" 2>&1
>>"%LOG%" echo [lint-exit] !errorlevel!

echo  4/6 Compilando la web...
>>"%LOG%" echo [build]
call npm run build >>"%LOG%" 2>&1
set "BUILD=!errorlevel!"
>>"%LOG%" echo [build-exit] !BUILD!

if "!BUILD!"=="0" (
  echo  5/6 Arrancando la web en http://localhost:3000 ...
  start "VS3D-servidor" /min cmd /c "npm run start -- -p 3000 > informes\servidor.log 2>&1"
  timeout /t 8 /nobreak >nul
  if not defined OPENED (
    set "OPENED=1"
    start "" http://localhost:3000
  )
  >>"%LOG%" echo [routes]
  node scripts\check-routes.mjs http://localhost:3000 >>"%LOG%" 2>&1
  >>"%LOG%" echo [routes-exit] !errorlevel!
  echo  6/6 Midiendo rendimiento con Lighthouse...
  >>"%LOG%" echo [lighthouse]
  call npx --yes lighthouse@13 http://localhost:3000 --quiet --preset=desktop --output=json --output-path=informes\lighthouse-escritorio.json --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo >>"%LOG%" 2>&1
  call npx --yes lighthouse@13 http://localhost:3000 --quiet --output=json --output-path=informes\lighthouse-movil.json --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo >>"%LOG%" 2>&1
  call npx --yes lighthouse@13 http://localhost:3000/proyectos/fine-nipona --quiet --output=json --output-path=informes\lighthouse-caso-movil.json --chrome-flags="--headless=new" --only-categories=performance,accessibility,best-practices,seo >>"%LOG%" 2>&1
  >>"%LOG%" echo [lighthouse-exit] !errorlevel!
) else (
  echo  La compilacion ha fallado. Claude revisara verificacion.log.
)

>>"%LOG%" echo [done] %date% %time%
echo.
echo  Listo. La web sigue en marcha en http://localhost:3000
echo  Esperando cambios de Claude para volver a verificar...
echo.

:wait
if exist "%~dp0rerun.txt" (
  del /q "%~dp0rerun.txt"
  echo  Cambios recibidos: repitiendo la verificacion...
  goto run
)
timeout /t 3 /nobreak >nul
goto wait
