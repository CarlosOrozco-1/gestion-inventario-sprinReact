#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AVISA LA URL DEL TUNEL POR PUSH (solo rama deploy-local)
# ============================================================
# El quick tunnel genera un hostname aleatorio en cada arranque, asi que
# despues de reiniciar el servidor no hay forma de adivinar la URL.
# Este script la lee de los logs y te la manda al celular con ntfy.sh
# (servicio de notificaciones push gratuito, sin cuenta).
#
# MANUAL:
#   ./notify-url.sh              -> espera el tunel y notifica
#   ./notify-url.sh --force      -> notifica aunque la URL no haya cambiado
#   ./notify-url.sh --test       -> solo envia un mensaje de prueba
#
# AUTOMATICO (tras instalar la unidad systemd, ver DESPLIEGUE_LOCAL_UBUNTU.md):
#   se ejecuta al arrancar el servidor y en cada `docker compose restart`
#   del tunel. Guarda la ultima URL notificada para no repetir el push.
#
# IMPORTANTE: la URL se verifica contra el sitio real ANTES de decidir si hay
# que notificar. Un quick tunnel puede quedar invalidado por Cloudflare en
# cualquier momento (resuelve NXDOMAIN) mientras cloudflared sigue en un bucle
# de reintentos "Tunnel not found"; antes, eso se tomaba por "la URL no cambio"
# y no se notificaba nada, dejando la app inalcanzable sin aviso. Ver
# tunnel-url.sh.

cd "$(dirname "${BASH_SOURCE[0]}")"

# Topic de ntfy: quien conozca la cadena puede leer esta URL, asi que
# debe ser larga y aleatoria. Cambiala si te expone de mas.
NTFY_TOPIC="${NTFY_TOPIC:?define NTFY_TOPIC con una cadena aleatoria larga}"
NTFY_URL="https://ntfy.sh/${NTFY_TOPIC}"
STATE_FILE=".ultima-url"

if [ "${1:-}" = "--test" ]; then
    curl -s --max-time 20 -H "Title: Inventario" \
         -H "Tags: white_check_mark" \
         -d "Notificaciones activadas. La proxima URL del tunel te llegara aqui." \
         "$NTFY_URL" >/dev/null
    echo "Mensaje de prueba enviado a $NTFY_TOPIC"
    exit 0
fi

# Espera a que cloudflared registre el tunnel y, si el anterior quedo invalidado,
# lo reinicia para forzar uno nuevo. Devuelve una URL comprobada.
URL=$(./tunnel-url.sh)

# No repetir el push solo si la URL no cambio Y sigue respondiendo, que es
# justamente lo que garantiza tunnel-url.sh.
if [ "${1:-}" != "--force" ] && [ -f "$STATE_FILE" ] && [ "$(cat "$STATE_FILE")" = "$URL" ]; then
    echo "La URL no cambio y responde bien ($URL). No se envia push de nuevo."
    exit 0
fi

curl -s --max-time 20 -H "Title: Tunel Inventario listo" \
     -H "Tags: rocket" -H "Priority: default" \
     -d "La app ya esta accesible en: $URL" \
     "$NTFY_URL" >/dev/null

echo "$URL" > "$STATE_FILE"
echo "URL notificada: $URL"
