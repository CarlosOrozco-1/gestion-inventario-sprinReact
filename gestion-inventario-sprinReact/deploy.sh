#!/usr/bin/env bash
set -euo pipefail

# Levanta el Caddy central (puertos 80/443) y la aplicación.
# Antes de la primera ejecución: correr `./setup-swap.sh` si la instancia tiene poca RAM.

echo ">> Levantando Caddy central (puertos 80/443)..."
(cd caddy-central && docker compose up -d)

echo ">> Construyendo y levantando la app (backend + frontend)..."
docker compose up -d --build

echo ""
echo ">> Listo."
echo ">> App: https://gestioninventario.duckdns.org"
