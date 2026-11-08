@echo off
REM Windows batch script: start-mysql.bat
echo ==========================================================
echo  MySQL External Storage Service Manager (Windows)
echo ==========================================================
if "%MYSQL_DATA_DIR%"=="" set MYSQL_DATA_DIR=D:\MySQL\Data
if "%MYSQL_BIN_DIR%"=="" set MYSQL_BIN_DIR=C:\Program Files\MySQL\MySQL Server 8.4\bin

net start MySQL84 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo [+] MySQL service is running.
) else (
  echo [*] Attempting service start...
  net start MySQL84
)

