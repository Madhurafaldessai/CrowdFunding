@echo off
REM Windows batch script: backup-db.bat
if "%DB_NAME%"=="" set DB_NAME=crowdfunding_platform
if "%DB_HOST%"=="" set DB_HOST=127.0.0.1
if "%DB_PORT%"=="" set DB_PORT=3306
if "%MYSQL_BIN_DIR%"=="" set MYSQL_BIN_DIR=C:\Program Files\MySQL\MySQL Server 8.4\bin

if not exist backups mkdir backups
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
set BACKUP_FILE=backups\%DB_NAME%_backup_%TIMESTAMP%.sql

echo [*] Backing up %DB_NAME% to %BACKUP_FILE%...
"%MYSQL_BIN_DIR%\mysqldump" --host=%DB_HOST% --port=%DB_PORT% --user=%DB_USER% --no-tablespaces --single-transaction --routines --triggers --events --databases %DB_NAME% > "%BACKUP_FILE%"
echo [+] Backup complete.

