@echo off
chcp 65001 >nul

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\AndroidSdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%

echo [0/4] Auto-incrementing version...
powershell -ExecutionPolicy Bypass -File "%~dp0bump-version.ps1"
if %ERRORLEVEL% NEQ 0 (
  echo Version increment failed
  pause
  exit /b 1
)

echo.
echo [1/4] cap sync...
cd /d "%~dp0.."
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
  echo cap sync failed
  pause
  exit /b 1
)
cd /d "%~dp0"

echo.
echo [2/4] Java check...
java -version
echo.

echo [3/4] Build AAB...
call gradlew.bat bundleRelease

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ============================================
  echo  Build SUCCESS
  echo  app\build\outputs\bundle\release\app-release.aab
  echo ============================================
  explorer app\build\outputs\bundle\release
) else (
  echo.
  echo  Build FAILED
)

pause
