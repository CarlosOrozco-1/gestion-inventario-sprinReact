#!/usr/bin/env bash
# =====================================================================
# SIGES - Restaurar un backup de PostgreSQL (formato custom de pg_dump)
# Uso:   ./restore_postgres.sh <archivo.dump>
# Ej.:   ./restore_postgres.sh ./backups/inventario_20260802_030000.dump
#
# IMPORTANTE: la base de datos destino debe existir y estar VACÍA (o
# reemplaza por completo su contenido). Se usa --clean --if-exists para
# eliminar objetos existentes.
# =====================================================================
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Uso: $0 <archivo.dump>" >&2
    exit 1
fi
DUMP="$1"

[ -f "$DUMP" ] || { echo "No existe el archivo: $DUMP" >&2; exit 1; }

DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-inventario}"
DB_NAME="${PGDATABASE:-inventario}"

echo "[$(date +'%F %T')] Restaurando '$(basename "$DUMP")' en '${DB_NAME}' ..."
pg_restore -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
           --clean --if-exists --no-owner "$DUMP"
echo "[$(date +'%F %T')] Restauración completada."