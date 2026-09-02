---
name: deploy-docker
description: Usar cuando se pida desplegar, reconstruir, subir los servicios, revisar/validar la build o diagnosticar "el front no carga". Construye las imágenes Docker, redespliega el stack y valida que el frontend carga (Chromium headless) y que el login por nginx funciona.
---

# Despliegue y validación Docker (SIGES)

## Paso 1 — Construir y levantar el stack completo

```bash
docker compose up -d --build
```

- `backend` → `:8080` (Spring Boot)
- `frontend` → `:80` (nginx sirve el build de Vite y proxya `/api`)

## Paso 2 — Validar que el frontend carga (sin navegador manual)

1. Assets con 200 y `index.html` sin caché:
   ```bash
   curl -sI http://localhost:80/ | grep -i cache-control
   curl -s -o /dev/null -w "%{http_code}\n" http://localhost:80/
   ```
2. El JS/CSS actual debe servir 200. Un **asset inexistente debe dar 404**
   (si da 200, el fallback SPA está sirviendo index.html como JS → pantalla
   blanca por caché vieja).
3. React monta y muestra el Login (validación con Chromium headless):
   ```bash
   timeout 40 chromium-browser --headless=new --no-sandbox --disable-gpu \
     --virtual-time-budget=10000 --dump-dom http://localhost:80 | grep -c "min-h-screen bg-brand-50"
   ```
   - Salida `1` (o `>0`) = Login renderizado = app OK. Errores de KWallet en
     stderr son ruido del entorno, ignorar.

## Paso 3 — API a través de nginx

```bash
curl -s -X POST http://localhost:80/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inventario.com","password":"admin123"}'
```
- Debe devolver un JSON con `token`.

## Paso 4 — Resumen de caché nginx (reglas vigentes)

- `/` y rutas SPA: `Cache-Control: no-cache, must-revalidate` (index siempre fresco).
- `/assets/*` y extensiones estáticas: `public, immutable` (hash = contenido).
- Assets inexistentes: `404` directo (no el fallback SPA).

## Nota
- Tras cambiar código del frontend hay que **reconstruir la imagen**:
  `docker compose build frontend && docker compose up -d frontend`.