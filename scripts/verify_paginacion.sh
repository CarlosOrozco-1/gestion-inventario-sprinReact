#!/usr/bin/env bash
# Verificacion del despliegue de paginacion (se ejecuta en el servidor).
set -euo pipefail
cd /home/gestioninventario/siges/gestion-inventario-sprinReact

EMAIL=$(grep '^ADMIN_EMAIL=' .env | cut -d= -f2-)
PASS=$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)

jq -n --arg e "$EMAIL" --arg p "$PASS" '{email: $e, password: $p}' > /tmp/lg.json
TOKEN=$(curl -s -X POST http://localhost:8081/api/auth/login \
  -H 'Content-Type: application/json' --data-binary @/tmp/lg.json | jq -r '.token // empty')
rm -f /tmp/lg.json

if [ -z "$TOKEN" ]; then
  echo "FALLO: no se pudo obtener token"
  exit 1
fi
echo "Login OK (token ${TOKEN:0:10}...)"
echo

echo "== GET /api/movimientos/paginado?page=0&size=10 =="
curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/movimientos/paginado?page=0&size=10' \
  | jq '{totalElements, totalPages, number, size, elementosEnPagina: (.content | length)}'
echo

echo "== GET /api/movimientos/paginado?page=1&size=10 (segunda pagina) =="
curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/movimientos/paginado?page=1&size=10' \
  | jq '{number, totalPages, elementosEnPagina: (.content | length)}'
echo

echo "== Tope de seguridad: size=99999 debe acotarse a 100 =="
curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/movimientos/paginado?page=0&size=99999' \
  | jq '{size, totalElements}'
echo

echo "== Endpoint antiguo intacto (lo usan Dashboard/Reportes/Ajustes) =="
curl -s -H "Authorization: Bearer $TOKEN" \
  'http://localhost:8081/api/movimientos' | jq 'length'
