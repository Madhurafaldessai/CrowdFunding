#!/usr/bin/env bash
# ==============================================================================
# Script: stop-mysql.sh
# Purpose: Safely stop MySQL service prior to ejecting external storage
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
PORT="${DB_PORT:-3306}"
HOST="${DB_HOST:-127.0.0.1}"
SOCKET="${DB_SOCKET:-/tmp/mysql.sock}"

echo "=========================================================="
echo " Safe MySQL Shutdown Manager"
echo "=========================================================="

if ! pgrep -f "$MYSQL_BIN/mysqld" >/dev/null 2>&1 && ! lsof -i :"$PORT" >/dev/null 2>&1; then
  echo "[+] MySQL is already stopped."
  echo "[+] Safe to unmount external drive."
  exit 0
fi

LAUNCHD_PLIST="/Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist"
if [ -f "$LAUNCHD_PLIST" ]; then
  echo "[*] Stopping MySQL launchd service safely..."
  sudo launchctl unload -w "$LAUNCHD_PLIST" 2>/dev/null || true
fi

# If still running, shut down gracefully via mysqladmin
if pgrep -f "$MYSQL_BIN/mysqld" >/dev/null 2>&1; then
  echo "[*] Performing graceful InnoDB buffer pool flush and shutdown via mysqladmin..."
  if [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
    "$MYSQL_BIN/mysqladmin" -u "${MYSQL_ROOT_USER:-root}" -p"$MYSQL_ROOT_PASSWORD" -S "$SOCKET" shutdown 2>/dev/null || true
  else
    "$MYSQL_BIN/mysqladmin" -u root -S "$SOCKET" shutdown 2>/dev/null || true
  fi
fi

# Wait for process exit
echo "[*] Waiting for process termination..."
for i in {1..20}; do
  if ! pgrep -f "$MYSQL_BIN/mysqld" >/dev/null 2>&1; then
    echo "[+] MySQL server shut down cleanly."
    echo "=========================================================="
    echo "[+] SUCCESS: You may now safely eject your external drive."
    echo "=========================================================="
    exit 0
  fi
  sleep 1
done

echo "[!] Warning: MySQL process is still shutting down. Check flush status before unmounting."
