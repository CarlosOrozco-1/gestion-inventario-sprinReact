#!/usr/bin/env bash
# ============================================================================
# Tests unitarios del backend (JUnit + Mockito) dentro de Docker.
#
# El entorno local no tiene un JDK con compilador, así que estos tests se
# ejecutan en la imagen oficial de Gradle con Java 21 (igual a la de build).
# Se corre SOLO el paquete de tests de `service` (los que no requieren BD);
# `BackendApplicationTests` (@SpringBootTest) necesita PostgreSQL y se excluye.
# ============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKDIR="/tmp/opencode/backend-tests"
IMG="gradle:9.5.1-jdk21"
GRADLE_CACHE_VOL="siges-gradle-cache"

echo "[1/3] Preparando copia de trabajo (sin build/.gradle)..."
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
cp -r "$ROOT/backend/src" "$WORKDIR/src"
cp "$ROOT/backend/build.gradle" "$WORKDIR/"
cp "$ROOT/backend/settings.gradle" "$WORKDIR/"

echo "[2/3] Ejecutando tests JUnit (paquete service) en $IMG..."
docker run --rm \
  -w /app \
  -e GRADLE_USER_HOME=/home/gradle/.gradle \
  -v "$WORKDIR:/app" \
  -v "$GRADLE_CACHE_VOL:/home/gradle/.gradle" \
  "$IMG" \
  gradle test --tests "com.gestion.inventario.service.*" --no-daemon --console=plain

echo "[3/3] Reporte HTML: $WORKDIR/build/reports/tests/test/index.html"
echo "TESTES DEL BACKEND: OK"