#!/usr/bin/env bash
# =====================================================================
# SIGES - Backup de PostgreSQL (pg_dump, formato custom)
# Uso:        ./backup_postgres.sh [dir-destino]
# Cron (todos los días a las 03:00):
#   0 3 * * * /ruta/al/proyecto/database/scripts/backup_postgres.sh >> /var/log/siges_backup.log 2>&1
# =====================================================================
set -euo pipefail

DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-inventario}"
DB_NAME="${PGDATABASE:-inventario}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_BASE="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
MAX_KEEP="${BACKUP_KEEP:-30}"

mkdir -p "$BACKUP_BASE"
TS=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_BASE/${DB_NAME}_${TS}.dump"

echo "[$(date +'%F %T')] Iniciando backup de '${DB_NAME}' en '${OUT}' ..."

# -Fc = formato custom (compacto y permite restore selectivo)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -Fc -f "$OUT" --no-owner

echo "[$(date +'%F %T')] Backup completado: $(du -h "$OUT" | cut -f1)"

# Eliminar backups más antiguos que MAX_KEEP días
echo "[$(date +'%F %T')] Purgando respaldos con más de ${MAX_KEEP} días ..."
find "$BACKUP_BASE" -type f -name "*.dump" -mtime "+${MAX_KEEP}" -delete

echo "[$(date +'%F %T')] OK."