#!/usr/bin/env bash
set -euo pipefail

# Muestra la URL publica HTTPS vigente del tunel local.
# El quick tunnel genera un hostname aleatorio nuevo en cada reinicio
# del contenedor, por eso hay que consultarlo en lugar de fijarlo.
#
#   ./get-url.sh        -> solo la URL (verificada: responde HTTP 200)
#   ./get-url.sh --check -> ademas imprime el codigo HTTP

cd "$(dirname "${BASH_SOURCE[0]}")"

# Delega en el helper, que ya garantiza una URL viva y, si el tunel quedo
# invalidado, lo reinicia para conseguir una nueva.
URL=$(./tunnel-url.sh)

echo "$URL"

if [ "${1:-}" = "--check" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "$URL" || echo 000)
    echo "HTTP $code"
    if [ "$code" != "200" ]; then
        echo "El tunel no responde. Reinicialo con:  docker compose restart" >&2
        exit 1
    fi
fi
