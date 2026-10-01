#!/usr/bin/env bash
set -euo pipefail

# Instala la unidad systemd del tunel en el servidor (una sola vez).
#   sudo ./instalar-tunnel-systemd.sh
# Verifica al final que la unidad quedo activa y que la URL responde.

set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

chmod +x boot-notify.sh tunnel-url.sh get-url.sh notify-url.sh

echo "== Habilitando y arrancando inventario-tunnel.service =="
sudo systemctl daemon-reload
sudo systemctl enable --now inventario-tunnel.service

echo
echo "== Estado de la unidad =="
systemctl is-enabled inventario-tunnel.service || true
systemctl is-active inventario-tunnel.service || true

echo
echo "== Ultimo arranque registrado =="
sudo journalctl -u inventario-tunnel.service -n 20 --no-pager 2>/dev/null | tail -20

echo
echo "== URL vigente =="
./get-url.sh --check
