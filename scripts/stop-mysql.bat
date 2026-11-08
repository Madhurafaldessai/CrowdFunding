@echo off
REM Windows batch script: stop-mysql.bat
echo ==========================================================
echo  Safe MySQL Shutdown Manager (Windows)
echo ==========================================================
net stop MySQL84
echo [+] MySQL service stopped. Remember to safely unmount before disconnecting.

