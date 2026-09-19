#!/usr/bin/env bash
set -euo pipefail

# Levanta el Caddy central (puertos 80/443) y la aplicación (backend + frontend).
# Uso desde la raíz del proyecto en la VPS:  ./deploy.sh
#
# Requisitos previos:
#   - .env en la raíz con (ver .env.example): DB_USERNAME, DB_PASSWORD,
#     MAIL_USERNAME, MAIL_PASSWORD, JWT_SECRET, TZ.
#   - Si la instancia tiene poca RAM, primero configurar swap (ej. 8 GB).

echo ">> Levantando Caddy central (puertos 80/443)..."
(cd caddy-central && docker compose up -d)

echo ">> Construyendo y levantando la app (backend + frontend + PostgreSQL)..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo ">> Listo."
echo ">> App: https://gestioninventario.duckdns.org"