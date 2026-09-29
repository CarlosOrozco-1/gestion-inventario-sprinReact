#!/usr/bin/env bash
set -euo pipefail

# Muestra la URL publica HTTPS vigente del tunel local.
# El quick tunnel genera un hostname aleatorio nuevo en cada reinicio
# del contenedor, por eso hay que consultarlo en lugar de fijarlo.
#
#   ./get-url.sh        -> solo la URL
#   ./get-url.sh --check -> ademas prueba que responda con HTTP 200

cd "$(dirname "${BASH_SOURCE[0]}")"

if ! docker compose ps --status running 2>/dev/null | grep -q cloudflared; then
    echo "El tunel no esta corriendo. Levantalo con:  docker compose up -d" >&2
    exit 1
fi

URL=$(docker compose logs --tail 200 cloudflared 2>&1 \
        | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' \
        | tail -1)

if [ -z "$URL" ]; then
    echo "No se encontro ninguna URL en los logs. Revisa:  docker compose logs cloudflared" >&2
    exit 1
fi

echo "$URL"

if [ "${1:-}" = "--check" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL" || echo 000)
    echo "HTTP $code"
    if [ "$code" != "200" ]; then
        echo "El tunel no responde. Reiniciálo con:  docker compose restart" >&2
        exit 1
    fi
fi
