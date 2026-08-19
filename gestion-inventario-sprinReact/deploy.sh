#!/usr/bin/env bash
set -euo pipefail

# Dominio DuckDNS. Se puede sobreescribir: DOMAIN=otro.duckdns.org ./deploy.sh
DOMAIN="${DOMAIN:-gestioninventario.duckdns.org}"

# Crear .env si no existe
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Fijar el dominio en .env
if grep -q '^DOMAIN=' .env; then
  sed -i "s|^DOMAIN=.*|DOMAIN=${DOMAIN}|" .env
else
  printf 'DOMAIN=%s\n' "$DOMAIN" >> .env
fi

echo ">> Dominio configurado: ${DOMAIN}"
echo ">> Construyendo y levantando servicios (backend, frontend, caddy)..."

docker compose up -d --build

echo ""
echo ">> Listo. Accedé a https://${DOMAIN}"
