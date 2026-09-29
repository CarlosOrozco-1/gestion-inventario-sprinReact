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
echo ">> Acceso a la Aplicación: http://192.168.200.23:8081"
echo ">> Acceso a la API Backend: http://192.168.200.23:8080/api"
if [ -d tunnel-local ] && [ -f tunnel-local/.env ]; then
    echo ">> Camara QR (requiere HTTPS): ver la URL notificada o ejecuta:"
    echo ">>   cd tunnel-local && ./get-url.sh"
fi
