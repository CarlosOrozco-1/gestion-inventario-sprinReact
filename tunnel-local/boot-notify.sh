#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# ARRANQUE DEL TUNEL + AVISO DE LA URL (lo invoca la unidad systemd)
# ============================================================
# El quick tunnel genera un hostname aleatorio distinto en cada arranque del
# servidor. Como no hay forma de adivinarlo, este wrapper levanta el tunel y
# manda la URL nueva al celular por push.
#
#   ./boot-notify.sh

cd "$(dirname "${BASH_SOURCE[0]}")"

docker compose up -d

# NTFY_TOPIC vive en el .env del tunel (no se commitea).
set -a
. ./.env
set +a

./notify-url.sh
