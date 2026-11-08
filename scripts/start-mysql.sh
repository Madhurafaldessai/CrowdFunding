#!/usr/bin/env bash
# ==============================================================================
# Script: start-mysql.sh
# Purpose: Safely inspect and ensure MySQL is running on external APFS storage
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env safely without eval/source syntax issues
if [ -f "$ROOT_DIR/.env" ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    if [ -n "$key" ]; then
      export "$key"="$value"
    fi
  done < "$ROOT_DIR/.env"
fi

MYSQL_BIN="${MYSQL_BIN_DIR:-/usr/local/mysql/bin}"
DATA_DIR="${MYSQL_DATA_DIR:-/Volumes/External drive/MySQL/Data}"
PORT="${DB_PORT:-3306}"
HOST="${DB_HOST:-127.0.0.1}"
SOCKET="${DB_SOCKET:-/tmp/mysql.sock}"

echo "=========================================================="
echo " MySQL External Storage Service Manager"
echo "=========================================================="
echo "Checking external drive mount point..."

# 1. Verify external drive mount
DRIVE_MOUNT=$(echo "$DATA_DIR" | sed -E 's|(/Volumes/[^/]+).*|\1|')
if [ ! -d "$DRIVE_MOUNT" ]; then
  echo "[-] ERROR: External drive is NOT mounted at: $DRIVE_MOUNT"
  echo "    Please connect and unlock your external drive, then retry."
  exit 1
fi
echo "[+] External drive detected at: $DRIVE_MOUNT"

# 2. Check if MySQL is already running (Safest first check)
if pgrep -f "$MYSQL_BIN/mysqld" >/dev/null 2>&1 || lsof -i :"$PORT" >/dev/null 2>&1; then
  echo "[+] MySQL is ALREADY RUNNING on port $PORT."
  echo "    Reusing active running instance safely."
  echo "----------------------------------------------------------"
  echo "REMINDER: Always stop MySQL and cleanly unmount before"
  echo "disconnecting or ejecting your external drive to prevent"
  echo "InnoDB tablespace corruption."
  echo "----------------------------------------------------------"
  exit 0
fi

# 3. If stopped, check data directory existence
if [ ! -d "$DATA_DIR" ] && ! sudo [ -d "$DATA_DIR" ] 2>/dev/null; then
  echo "[-] ERROR: MySQL datadir not found at: $DATA_DIR"
  echo "    If initializing a new data directory, run:"
  echo "    $MYSQL_BIN/mysqld --initialize-insecure --datadir=\"$DATA_DIR\" --user=_mysql"
  exit 1
fi
echo "[+] MySQL datadir verified: $DATA_DIR"

# 4. If stopped, start via launchd if service exists
LAUNCHD_PLIST="/Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist"
if [ -f "$LAUNCHD_PLIST" ]; then
  echo "[*] Starting MySQL via existing macOS launchd service..."
  sudo launchctl load -w "$LAUNCHD_PLIST" 2>/dev/null || sudo launchctl kickstart -k system/com.oracle.oss.mysql.mysqld
else
  echo "[*] Launchd service not detected. Starting mysqld_safe with datadir..."
  "$MYSQL_BIN/mysqld_safe" --datadir="$DATA_DIR" --port="$PORT" --socket="$SOCKET" &
fi

# 5. Wait for socket / port readiness
echo "[*] Waiting for MySQL to become ready on $HOST:$PORT..."
for i in {1..30}; do
  if [ -S "$SOCKET" ] || nc -z "$HOST" "$PORT" >/dev/null 2>&1; then
    echo "[+] MySQL server is now READY."
    echo "----------------------------------------------------------"
    echo "REMINDER: Stop MySQL cleanly before ejecting the drive."
    echo "----------------------------------------------------------"
    exit 0
  fi
  sleep 1
done

echo "[-] Timed out waiting for MySQL to start."
exit 1
