#!/usr/bin/env bash
# Verificacion del frontend desplegado (cache headers + bundle nuevo).
set -euo pipefail
cd /home/gestioninventario/siges/gestion-inventario-sprinReact

echo "== Estado de servicios =="
docker compose ps --format 'table {{.Service}}\t{{.Status}}'
echo

echo "== Cache-Control de / (debe ser no-cache) =="
curl -sI http://localhost:8081/ | grep -i cache-control
echo

echo "== Status de / (200) y de un asset inexistente (404) =="
curl -s -o /dev/null -w '/            %{http_code}\n' http://localhost:8081/
curl -s -o /dev/null -w '/assets/no-existe.js %{http_code}\n' http://localhost:8081/assets/no-existe.js
echo

echo "== Assets servidos =="
ASSETS=$(docker compose exec -T frontend ls /usr/share/nginx/html/assets/ | tr -d '\r')
echo "$ASSETS"
echo

BUNDLE=$(echo "$ASSETS" | grep -E '^index-.*\.js$' | head -1)
echo "== Bundle en el contenedor: $BUNDLE =="
echo "== index.html referencia ese bundle? =="
curl -s http://localhost:8081/ | grep -o "index-[A-Za-z0-9_-]*\.js"
echo

echo "== Marcadores de la paginacion en el bundle servido =="
docker compose exec -T frontend sh -c "cat /usr/share/nginx/html/assets/$BUNDLE" > /tmp/b.js
for marca in 'Ver página anterior' 'Ver página siguiente' 'Página' 'movimientos' 'materiales' 'ajustes' 'usuarios' 'sugerencias' 'max-h-72'; do
  n=$(grep -o -F "$marca" /tmp/b.js | wc -l)
  printf '  %-22s %s\n' "$marca" "$n"
done
rm -f /tmp/b.js
