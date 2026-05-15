@echo off
chcp 65001 >nul

set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\AndroidSdk
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%

echo [1/3] cap sync...
cd ..
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
  echo cap sync failed
  pause
  exit /b 1
)
cd android

echo.
echo [2/3] Java check...
java -version
echo.

echo [3/3] Build AAB...
call gradlew.bat bundleRelease

if %ERRORLEVEL% EQU 0 (
  echo.
  echo Build SUCCESS
  echo app\build\outputs\bundle\release\app-release.aab
  explorer app\build\outputs\bundle\release
) else (
  echo.
  echo Build FAILED
)

pause
