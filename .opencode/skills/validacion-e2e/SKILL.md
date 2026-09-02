---
name: validacion-e2e
description: Usar cuando se pida validar el sistema, correr el smoke test E2E, "testeamos", "prueba que funcione", o cuando un test/smoke test falle por datos residuales. Ejecuta el smoke test end-to-end contra el backend Docker y limpia la BD de datos E2E.
---

# Validación E2E (smoke test)

Valida el sistema contra el backend desplegado en Docker. El frontend se
valida aparte (ver `deploy-docker`).

## Paso 1 — Confirmar que el backend está arriba

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/items
```

- `401` → backend vivo (respuesta esperada sin token).
- Error de conexión → levantar servicios: `docker compose up -d --build`.

## Paso 2 — Ejecutar el smoke test

```bash
python3 scripts/smoke_test_e2e.py
```

- Éxito esperado: `=== RESUMEN: 64 PASS, 0 FAIL ===`.

## Paso 3 — Si falla por datos residuales

El script usa **códigos fijos** (99001/99002) y usuarios `-E2E`; una ejecución
anterior dejó datos que chocan con las validaciones de duplicados. Limpiar y
reintentar:

```bash
docker exec -i migracion-springboot-react-db-1 psql -U inventario -d inventario < scripts/limpiar_e2e.sql
python3 scripts/smoke_test_e2e.py
```

## Paso 4 — Dejar la BD limpia SIEMPRE

Tras un smoke test exitoso, volver a limpiar los datos E2E generados:

```bash
docker exec -i migracion-springboot-react-db-1 psql -U inventario -d inventario < scripts/limpiar_e2e.sql
```

## Cómo reportar al usuario

- Resumen tipo: `=== RESUMEN: N PASS, 0 FAIL ===`.
- Si falló algo, copiar la línea/líneas FAIL exactas y el motivo (no el
  log completo).