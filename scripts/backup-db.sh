#!/usr/bin/env bash
# ==============================================================================
# Script: backup-db.sh
# Purpose: Backup crowdfunding_platform database with schema, triggers, routines
# Storage: Timestamped files inside ./backups on internal project drive
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"

mkdir -p "$BACKUP_DIR"

# Load .env safely without eval/source syntax issues
if [ -f "$ROOT_DIR/.env" ]; then
  while IFS='=' read -r key value || [ -n "$key" ]; do
    # Skip comments and empty lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Trim leading/trailing whitespace and quotes
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    if [ -n "$key" ]; then
      export "$key"="$value"
    fi
  done < "$ROOT_DIR/.env"
fi

MYSQL_BIN="${MYSQL_BIN_DIR:-/usr/local/mysql/bin}"
HOST="${DB_HOST:-127.0.0.1}"
PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-crowdfunding_platform}"
USER="${DB_ADMIN_USER:-${DB_USER:-root}}"
PASSWORD="${DB_ADMIN_PASSWORD:-${DB_PASSWORD:-${MYSQL_ROOT_PASSWORD:-}}}"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"

echo "=========================================================="
echo " Database Backup Utility"
echo "=========================================================="
echo "Target Database: $DB_NAME"
echo "Host:            $HOST:$PORT"
echo "Output Path:     $BACKUP_FILE"
echo "Starting export (schema, data, routines, triggers, events)..."

# Ensure password is supplied securely without exposing in process list or output
export MYSQL_PWD="$PASSWORD"

"$MYSQL_BIN/mysqldump" \
  --host="$HOST" \
  --port="$PORT" \
  --user="$USER" \
  --no-tablespaces \
  --single-transaction \
  --quick \
  --routines \
  --triggers \
  --events \
  --databases "$DB_NAME" > "$BACKUP_FILE"

unset MYSQL_PWD

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "[+] SUCCESS: Backup completed successfully ($SIZE)."
echo "[+] Saved to: $BACKUP_FILE"
