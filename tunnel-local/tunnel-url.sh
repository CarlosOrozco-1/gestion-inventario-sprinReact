#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# RESUELVE LA URL PUBLICA VIGENTE DEL TUNEL Y GARANTIZA QUE RESPONDA
# ============================================================
# Lo usan get-url.sh y notify-url.sh.
#
# POR QUE EXISTE ESTE HELPER
#
# Un "quick tunnel" de Cloudflare es efimero: pasado cierto tiempo Cloudflare
# lo da de baja y hostname resuelve NXDOMAIN. cloudflared, en vez de salir,
# se queda reintentando en un bucle con
#
#   ERR Register tunnel error from server side error="Unauthorized: Tunnel not found"
#
# y `restart: unless-stopped` no ayuda, porque el contenedor NUNCA muere: solo
# reintenta cada 32 s indefinidamente.
#
# El bug original de este script era raspar la URL con grep sobre
# `docker compose logs`, que devuelve TODO el historial. Con el tunel muerto
# seguia devolviendo el hostname del registro exitoso de hace horas, asi que
# get-url.sh anunciaba una URL inservible y notify-url.sh decia "la URL no
# cambio" y se callaba. Sin push, sin aviso, sin app.
#
# Este helper scrapea la URL, la PRUEBA contra el sitio real y, si no
# responde, reinicia el contenedor para forzar un quick tunnel nuevo.

cd "$(dirname "${BASH_SOURCE[0]}")"

RUNNING=$(docker compose ps --status running 2>/dev/null | grep -c cloudflared || true)
if [ "$RUNNING" -eq 0 ]; then
    echo "ERROR: el tunel no esta corriendo. Levantalo con:  docker compose up -d" >&2
    exit 1
fi

extraer_url() {
    docker compose logs --tail 200 cloudflared 2>&1 \
        | grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' \
        | tail -1 || true
}

responde() {
    [ -n "$1" ] && [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 25 "$1" || echo 000)" = "200" ]
}

# Espera a que haya una URL registrada Y que responda HTTP 200.
esperar_url() {
    local i url
    for i in $(seq 1 30); do
        url=$(extraer_url)
        if responde "$url"; then
            echo "$url"
            return 0
        fi
        sleep 5
    done
    return 1
}

URL=$(esperar_url) || URL=""

if [ -z "$URL" ]; then
    echo "AVISO: el tunel no responde (quedo invalidado o sin registrar). Reiniciando..." >&2
    docker compose restart cloudflared >/dev/null
    if ! URL=$(esperar_url); then
        echo "ERROR: no se pudo obtener una URL que responda." >&2
        echo "       Revisa:  docker compose logs cloudflared" >&2
        exit 1
    fi
    echo "Tunel recreado con una URL nueva." >&2
fi

echo "$URL"
