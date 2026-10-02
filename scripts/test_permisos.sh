#!/usr/bin/env bash
# ============================================================
# MATRIZ DE PERMISOS REAL   endpoint x rol
# ============================================================
#   bash scripts/test_permisos.sh            -> ejecuta la matriz
#   bash scripts/test_permisos.sh --matriz   -> reimprime el resultado
#
# QUE HACE Y QUE NO TOCA
# Crea usuarios qa.*, se autentica con cada rol y ejecuta cada endpoint de
# verdad: 2xx = permitido, 403 = el rol rechazo la accion.
#
# IMPORTANTE: trabaja sobre un item y una presentacion PROPIOS, creados por
# este script, y los borra al terminar. Nunca toca `items[0]` ni ningun
# material real: una version anterior de este script mutaba el primer item de
# la lista y dejo el nombre de "Alcohol Etilico" pisado con el nombre de prueba.
# Tampoco toca usuarios reales: los PUT de /usuarios/admin apuntan a los
# usuarios qa.* que este script crea, nunca a uno que ya existia.
# Si vas a copiar la idea, crea tus datos y borralos tu.
#
# Los movimientos se miden con cantidad VALIDA (1), no con una cantidad
# invalida. Razon: MovimientoDTO lleva @Min(1) y el controller lo valida con
# @Valid, asi que una cantidad 0 se rechaza con 400 ANTES de llegar al service y
# devolveria 400 para los tres roles: no mediria el permiso de nada. Con
# cantidad valida, ADMIN y JEFE reciben 200 y AUXILIAR recibe 403 en los ajustes.
# Esto si crea movimientos, pero solo sobre la presentacion QA que crea este
# script, y la limpieza los borra por presentacion antes de borrar el item.
#
# El JSON va COMPLETO en cada probe, no partido en fragments concatenados: un
# objeto anidado dentro de otro ("{...,{"type":...}}") es JSON invalido y
# Spring responde 400 antes de llegar al service.
set -uo pipefail

BASE=http://localhost:8081/api
APP_DIR=/home/gestioninventario/siges/gestion-inventario-sprinReact

# La matriz borra filas al final. Se exige el flag --confirmar para no depender
# de que el que lo ejecuta lea la cabecera del script antes de correrlo.
if [ "${1:-}" != "--confirmar" ]; then
    cat <<'AVISO'
Este script ESCRIBE y BORRA filas en la base de datos ($BASE):
  - crea usuarios qa.jefe@ / qa.auxiliar@ y usuarios qa.<random>@t.local
  - crea un item y una presentacion con code 9999
  - al terminar borra esos usuarios, item, presentacion y sus movimientos
Toca $APP_DIR. Corrialo solo contra un entorno de pruebas.
AVISO
    echo "Para ejecutarlo de verdad:"
    echo "  bash scripts/test_permisos.sh --confirmar"
    exit 1
fi

cd "$APP_DIR" || exit 1

ADMIN_EMAIL=$(grep -E '^ADMIN_EMAIL='     .env | cut -d= -f2- | tr -d '"'"'"' \r')
ADMIN_PASSWORD=$(grep -E '^ADMIN_PASSWORD=' .env | cut -d= -f2- | tr -d '"'"'"' \r')

J_EMAIL="qa.jefe@inventa.local"
A_EMAIL="qa.auxiliar@inventa.local"
Q_PASS="QaTemp2026x"
QA_CODE=9999
QA_ITEM_NAME="QA Permisos Temporal"

login() {
    curl -s --max-time 20 -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
         -d "{\"email\":\"$1\",\"password\":\"$2\"}" | jq -r '.token // empty'
}
usuarios() { curl -s --max-time 20 "$BASE/usuarios/admin" -H "Authorization: Bearer $ADMIN_TOKEN"; }
dbq() {
    local u n
    u=$(docker compose exec -T db printenv POSTGRES_USER 2>/dev/null | tr -d '\r')
    n=$(docker compose exec -T db printenv POSTGRES_DB 2>/dev/null | tr -d '\r')
    docker compose exec -T db psql -U "$u" -d "$n" -A -t -c "$1"
}

ADMIN_TOKEN=$(login "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
[ -z "$ADMIN_TOKEN" ] && { echo "FALLO: no se pudo autenticar como ADMIN" >&2; exit 1; }

# --- Datos propios del script -------------------------------------------
QA_ITEM=$(curl -s --max-time 20 "$BASE/items" -H "Authorization: Bearer $ADMIN_TOKEN" \
          | jq -r ".[] | select(.code == $QA_CODE) | .id" | head -1)
if [ -z "$QA_ITEM" ]; then
    QA_ITEM=$(curl -s --max-time 20 -X POST "$BASE/items" -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H 'Content-Type: application/json' \
        -d "{\"code\":$QA_CODE,\"name\":\"$QA_ITEM_NAME\",\"presentations\":[{\"name\":\"UND QA\",\"size\":\"1\",\"minStock\":1,\"maxStock\":10,\"estimatedCost\":1}]}" \
        | jq -r '.id // empty')
fi
QA_PRES=$(curl -s --max-time 20 "$BASE/items" -H "Authorization: Bearer $ADMIN_TOKEN" \
          | jq -r ".[] | select(.code == $QA_CODE) | .presentations[0].id" | head -1)
QA_QR=$(curl -s --max-time 20 "$BASE/items" -H "Authorization: Bearer $ADMIN_TOKEN" \
        | jq -r ".[] | select(.code == $QA_CODE) | .presentations[0].qrCode" | head -1)

ITEM_BODY="{\"code\":$QA_CODE,\"name\":\"$QA_ITEM_NAME\",\"presentations\":[{\"name\":\"UND QA\",\"size\":\"1\",\"minStock\":1,\"maxStock\":10,\"estimatedCost\":1}]}"
PRES_BODY='{"name":"UND QA","size":"1","minStock":1,"maxStock":10,"estimatedCost":1}'
# Cantidad 0 => el backend rechaza con 400 DESPUES de validar el rol. Sirve para
# medir autorizacion sin crear movimientos reales.
# El JSON va COMPLETO en cada probe, no partido en fragments concatenados: un
# objeto anidado dentro de otro ("{...,{"type":...}}") es JSON invalido y
# Spring responde 400 antes de llegar al service, con lo que la matriz daria 400
# para los tres roles y no mediria nada.

echo "== Datos del test =="
echo "  item QA id=$QA_ITEM   presentacion QA id=$QA_PRES"

declare -A TOK
declare -A QA_ID
TOK[ADMIN]="$ADMIN_TOKEN"
for pair in "JEFE:$J_EMAIL" "AUXILIAR:$A_EMAIL"; do
    ROL="${pair%%:*}"; MAIL="${pair##*:}"
    ID=$(usuarios | jq -r --arg e "$MAIL" '.[] | select(.email == $e) | .id' | head -1)
    if [ -z "$ID" ]; then
        ID=$(curl -s --max-time 20 -X POST "$BASE/usuarios/admin" -H "Authorization: Bearer $ADMIN_TOKEN" \
             -H 'Content-Type: application/json' \
             -d "{\"name\":\"QA $ROL\",\"email\":\"$MAIL\",\"password\":\"$Q_PASS\",\"rol\":\"$ROL\"}" \
             | jq -r '.id // empty')
    fi
    # Se guarda el id del usuario QA: los PUT de /usuarios/admin van contra el,
    # nunca contra un usuario real de la base.
    QA_ID[$ROL]="$ID"
    [ -n "$ID" ] && curl -s -o /dev/null --max-time 20 -X PUT "$BASE/usuarios/admin/$ID/status" \
        -H "Authorization: Bearer $ADMIN_TOKEN" -H 'Content-Type: application/json' -d '{"active":true}'
    TOK[$ROL]=$(login "$MAIL" "$Q_PASS")
    [ -z "${TOK[$ROL]}" ] && echo "  AVISO: fallo el login de $ROL"
done

# Destino de los PUT de la seccion USUARIOS: el jefe QA de esta corrida.
QA_JEFE_ID="${QA_ID[JEFE]}"
if [ -z "$QA_JEFE_ID" ]; then
    echo "FALLO: no se pudo crear el usuario qa.jefe; se aborta antes de tocar /usuarios/admin" >&2
    exit 1
fi
echo "  usuarios qa listos"

echo
echo "== MATRIZ endpoint x rol =="
printf '%-44s %-11s %-11s %-11s\n' "ENDPOINT" "ADMIN" "JEFE" "AUXILIAR"
printf -- '----------------------------------------------------------------------------------------------------------\n'

probe() {
    local desc="$1" method="$2" path="$3" body="${4:-}" out="" ROL T CODE
    for ROL in ADMIN JEFE AUXILIAR; do
        case $ROL in ADMIN) T="${TOK[ADMIN]}";; JEFE) T="${TOK[JEFE]}";; *) T="${TOK[AUXILIAR]}";; esac
        [ -z "$T" ] && { out+=$(printf '%-11s' "sin-tok"); continue; }
        if [ -n "$body" ]; then
            CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X "$method" "$BASE$path" \
                   -H "Authorization: Bearer $T" -H 'Content-Type: application/json' -d "$body")
        else
            CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 -X "$method" "$BASE$path" \
                   -H "Authorization: Bearer $T")
        fi
        out+=$(printf '%-11s' "$CODE")
    done
    printf '%-44s %s\n' "$desc" "$out"
}

echo "-- LECTURAS --"
probe "GET  /items"                     GET "/items"
probe "GET  /items/{id}"                GET "/items/$QA_ITEM"
probe "GET  /insumos"                   GET "/insumos"
probe "GET  /insumos/sugerencias-stock" GET "/insumos/sugerencias-stock"
probe "GET  /presentations/qr/{qr}"     GET "/presentations/qr/$QA_QR"
probe "GET  /movimientos"               GET "/movimientos"
probe "GET  /movimientos/paginado"      GET "/movimientos/paginado?page=0&size=5"
probe "GET  /usuarios"                  GET "/usuarios"
echo
echo "-- ESCRITURA DEL CATALOGO --"
probe "POST /items"                     POST "/items" "$ITEM_BODY"
probe "PUT  /items/{id}"                PUT  "/items/$QA_ITEM" "$ITEM_BODY"
probe "PUT  /items/{id}/estado"         PUT  "/items/$QA_ITEM/estado" '{"activo":true}'
probe "POST /items/{id}/presentations"  POST "/items/$QA_ITEM/presentations" "$PRES_BODY"
probe "PUT  /presentations/{id}"        PUT  "/presentations/$QA_PRES" "$PRES_BODY"
echo
echo "-- MOVIMIENTOS (cantidad valida: mide el permiso de verdad) --"
# Un ENTRADA o SALIDA debe dar 200 a los tres roles: es la operacion diaria.
# Un AJUSTE_* debe dar 200 a ADMIN y JEFE y 403 a AUXILIAR.
probe "POST /movimientos ENTRADA"        POST "/movimientos" "{\"presentationId\":$QA_PRES,\"type\":\"ENTRADA\",\"quantity\":1,\"detail\":\"Prueba de permisos entrada\"}"
probe "POST /movimientos SALIDA"         POST "/movimientos" "{\"presentationId\":$QA_PRES,\"type\":\"SALIDA\",\"quantity\":1,\"detail\":\"Prueba de permisos salida\"}"
probe "POST /movimientos AJUSTE_POS"     POST "/movimientos" "{\"presentationId\":$QA_PRES,\"type\":\"AJUSTE_POSITIVO\",\"quantity\":1,\"detail\":\"Justificacion de prueba suficientemente larga\"}"
probe "POST /movimientos AJUSTE_NEG"     POST "/movimientos" "{\"presentationId\":$QA_PRES,\"type\":\"AJUSTE_NEGATIVO\",\"quantity\":1,\"detail\":\"Justificacion de prueba suficientemente larga\"}"
# Un ajuste sin justificacion debe dar 400 a los que SI pueden ajustar: el
# permiso pasa y entonces se exige justificacion (AGENTS.md).
probe "POST /movimientos AJUSTE sin justif" POST "/movimientos" "{\"presentationId\":$QA_PRES,\"type\":\"AJUSTE_NEGATIVO\",\"quantity\":1,\"detail\":\"corto\"}"
echo
echo "-- CATALOGO: duplicado y presentacion inexistente --"
probe "POST /items codigo duplicado"     POST "/items" "$ITEM_BODY"
probe "POST /items en item inexistente"  POST "/items/999999/presentations" "$PRES_BODY"
echo
echo "-- REPORTES --"
probe "POST /reportes/excel"            POST "/reportes/excel" '{}'
probe "POST /reportes/pdf"              POST "/reportes/pdf" '{}'
probe "POST /reportes/proyecciones/excel" POST "/reportes/proyecciones/excel" '{}'
probe "POST /reportes/proyecciones/pdf" POST "/reportes/proyecciones/pdf" '{}'
echo
echo "-- USUARIOS --"
probe "GET  /usuarios/admin"            GET "/usuarios/admin"
probe "POST /usuarios/admin"            POST "/usuarios/admin" "{\"name\":\"QA\",\"email\":\"qa.$RANDOM@t.local\",\"password\":\"$Q_PASS\",\"rol\":\"AUXILIAR\"}"
# Los tres PUT apuntan al jefe QA de ESTA corrida, con el mismo nombre, rol y
# estado que ya tiene: miden que solo ADMIN puede administrar usuarios sin
# cambiar nada, y en ningun caso tocan a un usuario real.
probe "PUT  /usuarios/admin/{id}"       PUT  "/usuarios/admin/$QA_JEFE_ID" "{\"name\":\"QA JEFE\",\"email\":\"$J_EMAIL\",\"rol\":\"JEFE\"}"
probe "PUT  /usuarios/admin/{id}/rol"   PUT  "/usuarios/admin/$QA_JEFE_ID/rol" '{"rol":"JEFE"}'
probe "PUT  /usuarios/admin/{id}/status" PUT "/usuarios/admin/$QA_JEFE_ID/status" '{"active":true}'
echo
echo "-- AUDITORIA / QR / PERFIL --"
probe "GET  /auditoria"                 GET "/auditoria"
probe "GET  /auditoria/eventos"         GET "/auditoria/eventos"
probe "POST /presentations/{id}/qr-event" POST "/presentations/$QA_PRES/qr-event" '{"accion":"CONSULTA"}'
probe "PUT  /perfil/cambiar-password"   PUT "/perfil/cambiar-password" '{"currentPassword":"incorrecta","newPassword":"OtraClave2026"}'

echo
echo "== Limpieza =="
# db() CORRE la sentencia y falla si psql devuelve error. La version anterior
# usaba `>/dev/null`, que se tragaba los errores: como la columna de la FK no es
# presentation_id sino inventario_id, NINGUN borror se ejecutaba y el script
# reportaba "base limpia" sin haber borrado nada. Ahora un error de limpieza
# detiene el script.
db() {
    local out
    out=$(dbq "$1" 2>&1) || { echo "  ERROR de limpieza: $out" >&2; LIMPIEZA_FALLO=1; return; }
    case "$out" in *ERROR*) echo "  ERROR de limpieza: $out" >&2; LIMPIEZA_FALLO=1;; esac
}

LIMPIEZA_FALLO=0

# La FK de inventario_movimientos hacia presentations se llama inventario_id.
# El orden importa por las llaves foraneas: primero movimientos, luego
# presentaciones, luego el item.
db "DELETE FROM inventario_movimientos WHERE inventario_id IN (SELECT p.id FROM presentations p JOIN items i ON i.id = p.item_id WHERE i.code = $QA_CODE);"
db "DELETE FROM presentations WHERE item_id IN (SELECT id FROM items WHERE code = $QA_CODE);"
db "DELETE FROM items WHERE code = $QA_CODE AND name = '$QA_ITEM_NAME';"
db "DELETE FROM usuarios WHERE email IN ('$J_EMAIL','$A_EMAIL') OR email LIKE 'qa.%@t.local';"
db "DELETE FROM audit_logs WHERE description LIKE '%$QA_ITEM_NAME%';"
echo "  item, presentacion, movimientos, usuarios y bitacora de prueba borrados"

# Comprobacion de que no quedaron residuos. Cuenta usuarios qa por prefijo de
# correo, que es como los crea este script.
LEFT=$(dbq "SELECT (SELECT count(*) FROM items WHERE code = $QA_CODE)
  + (SELECT count(*) FROM usuarios WHERE email IN ('$J_EMAIL','$A_EMAIL') OR email LIKE 'qa.%@t.local')
  + (SELECT count(*) FROM inventario_movimientos WHERE detail LIKE 'Prueba de permisos%' OR detail LIKE 'Justificacion de prueba%');" 2>&1)
echo "  residuos QA: ${LEFT:-0}"
if [ "$LIMPIEZA_FALLO" = "1" ] || [ "${LEFT:-0}" != "0" ]; then
  echo "  FALLO: la limpieza no dejo la base como estaba" >&2
  exit 1
fi
echo "  base limpia"
echo
echo "Leyenda: 2xx = permitido | 403 = ROL RECHAZADO | 400 = el rol paso, fallo validacion | 401 = sin token"