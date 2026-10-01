#!/usr/bin/env bash
set -uo pipefail

# ============================================================
# INSTALA LA UNIDAD SYSTEMD DEL TUNEL (una sola vez)
# ============================================================
#   sudo ./instalar-tunnel-systemd.sh
#
# Instala dos cosas:
#   - inventario-tunnel.service      -> levanta el tunel y avisa la URL al boot.
#   - inventario-tunnel-watchdog.*   -> lo revisa cada 15 min.
#
# systemd solo busca unidades en /etc/systemd/system/, /lib/systemd/system/ y
# /usr/lib/systemd/system/. Tener el .service junto al codigo NO alcanza: hay
# que copiarlo ahi y recargar la lista antes de poder habilitarlo.
#
# NO hace falta detener el contenedor antes de correr esto. `docker compose up -d`
# sobre un contenedor ya levantado es una no-op, asi que la URL publicada no cambia
# y no se manda un push espurio. Pararlo, en cambio, generaria un quick tunnel
# nuevo y obligaria a avisar de otro enlace.

cd "$(dirname "${BASH_SOURCE[0]}")"
TARGET=/etc/systemd/system

chmod +x boot-notify.sh tunnel-url.sh get-url.sh notify-url.sh instalar-tunnel-systemd.sh

echo "== Copiando las unidades a $TARGET =="
# install falla y detiene el script si no hay permisos: por eso se exige sudo.
install -m 644 inventario-tunnel.service            "$TARGET/"
install -m 644 inventario-tunnel-watchdog.service   "$TARGET/"
install -m 644 inventario-tunnel-watchdog.timer     "$TARGET/"
echo "  inventario-tunnel.service"
echo "  inventario-tunnel-watchdog.service"
echo "  inventario-tunnel-watchdog.timer"

echo
echo "== Recargando la lista de unidades =="
systemctl daemon-reload

echo
echo "== Habilitando y arrancando el tunel =="
systemctl enable --now inventario-tunnel.service

echo
echo "== Habilitando el watchdog (revisar el tunel cada 15 min) =="
systemctl enable --now inventario-tunnel-watchdog.timer

echo
echo "== Estado =="
printf '  %-38s %s\n' "inventario-tunnel.service (enabled)" "$(systemctl is-enabled inventario-tunnel.service 2>&1)"
printf '  %-38s %s\n' "inventario-tunnel.service (active)"  "$(systemctl is-active  inventario-tunnel.service 2>&1)"
printf '  %-38s %s\n' "watchdog.timer (enabled)"             "$(systemctl is-enabled inventario-tunnel-watchdog.timer 2>&1)"
printf '  %-38s %s\n' "watchdog.timer (active)"              "$(systemctl is-active  inventario-tunnel-watchdog.timer 2>&1)"

echo
echo "== Proximo chequeo programado =="
systemctl list-timers inventario-tunnel-watchdog.timer --no-pager 2>/dev/null | tail -2

echo
echo "== Ultimo arranque registrado =="
journalctl -u inventario-tunnel.service -n 12 --no-pager 2>/dev/null | tail -12

echo
echo "== URL vigente (verificada) =="
./get-url.sh --check
