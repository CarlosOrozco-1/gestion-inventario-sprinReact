#!/usr/bin/env bash
set -euo pipefail

# Script de despliegue local para Ubuntu Server
# Uso: ./deploy-local.sh

echo ">> Verificando archivo .env..."
if [ ! -f .env ]; then
    echo ">> Creando .env desde .env.example..."
    cp .env.example .env
fi

echo ">> Construyendo y levantando contenedores (PostgreSQL + Backend + Frontend)..."
docker compose up -d --build

echo ""
echo ">> Despliegue Local Exitoso!"
echo ">> Acceso a la Aplicación: http://192.168.200.23:8081"
echo ">> Acceso a la API Backend: http://192.168.200.23:8080/api"
