#!/usr/bin/env bash
set -euo pipefail

# Script de despliegue local para Ubuntu Server
# Uso: ./deploy-local.sh

echo ">> Verificando archivo .env..."
if [ ! -f .env ]; then
    echo ">> Creando .env desde .env.example..."
    cp .env.example .env
    echo ">> AVISO: .env generado con valores de ejemplo. Editalo antes de continuar."
fi

# La firma JWT usa HS512, que exige >= 64 bytes (RFC 7518). Con menos, el
# backend responde 500 en /api/auth/login por WeakKeyException.
echo ">> Validando JWT_SECRET..."
JWT_SECRET_LEN=$(grep -E '^JWT_SECRET=' .env | cut -d= -f2- | tr -d '\n' | wc -c || true)
if [ "$JWT_SECRET_LEN" -lt 64 ]; then
    echo ">> ERROR: JWT_SECRET tiene $JWT_SECRET_LEN bytes y se requieren 64 o mas."
    echo ">> Genera uno valido en el servidor con:"
    echo ">>   sed -i \"s|^JWT_SECRET=.*|JWT_SECRET=\$(openssl rand -hex 48)|\" .env"
    echo ">> Luego vuelve a ejecutar este script."
    exit 1
fi
echo ">> JWT_SECRET OK ($JWT_SECRET_LEN bytes)"

echo ">> Construyendo y levantando contenedores (PostgreSQL + Backend + Frontend)..."
docker compose up -d --build

# El túnel HTTPS es lo unico que habilita la camara del escaner QR: el
# navegador solo la expone en un contexto seguro y por IP de red no lo es.
if [ -d tunnel-local ]; then
    echo ">> Levantando el tunel HTTPS..."
    (cd tunnel-local && docker compose up -d)

    # El quick tunnel genera un hostname aleatorio distinto en cada arranque.
    # Sin avisar, nadie sabria como entrar tras reiniciar el equipo.
    if [ -f tunnel-local/.env ]; then
        echo ">> Notificando la URL del tunel..."
        (cd tunnel-local && set -a && . ./.env && set +a && ./notify-url.sh) || \
            echo ">> AVISO: no se pudo notificar la URL. Consultala con: cd tunnel-local && ./get-url.sh"
    else
        echo ">> AVISO: falta tunnel-local/.env, no se puede notificar la URL."
        echo ">> Consulta la URL vigente con:  cd tunnel-local && ./get-url.sh"
    fi
fi

echo ""
echo ">> Despliegue Local Exitoso!"

# La IP del servidor la entrega el DHCP, asi que no esta escrita aqui: vive en
# el .env (SERVER_IP). Imprimir una IP fija hacia que el router la cambie otra
# vez es lo que hace que este mensaje mienta, asi que si falta se avisa en vez
# de adivinar. Se lee con grep/cut igual que JWT_SECRET, sin ejecutar el .env.
leer_env() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r' | sed 's/^["'\'']//; s/["'\'']$//'; }

SERVER_IP=$(leer_env SERVER_IP)
APP_PUERTO=$(leer_env APP_PUERTO); APP_PUERTO=${APP_PUERTO:-8081}
API_PUERTO=$(leer_env API_PUERTO); API_PUERTO=${API_PUERTO:-8080}

if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" != "cambia_esto" ]; then
    echo ">> Acceso a la Aplicación: http://$SERVER_IP:$APP_PUERTO"
    echo ">> Acceso a la API Backend: http://$SERVER_IP:$API_PUERTO/api"
else
    echo ">> AVISO: el .env no define SERVER_IP, asi que no se imprimen las URLs de red."
    echo ">>   Agrega SERVER_IP=<ip-actual-del-servidor> al .env (ip a)."
    echo ">>   Se la ip del servidor con:  hostname -I"
fi
if [ -d tunnel-local ] && [ -f tunnel-local/.env ]; then
    echo ">> Camara QR (requiere HTTPS): ver la URL notificada o ejecuta:"
    echo ">>   cd tunnel-local && ./get-url.sh"
fi
