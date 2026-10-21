# Release 1.2.0 — Movimientos, Kárdex y correcciones de inventario

**Versión:** `1.2.0`
**Fecha:** 2026-10-21
**Fuente de versión:** archivo raíz `VERSION`; metadatos de Gradle y npm alineados a esta versión.

## Resumen

La versión 1.2.0 separa claramente el registro de movimientos de la consulta histórica del Kárdex, completa la trazabilidad por producto y corrige fallos de renderizado en Auditoría y Trazabilidad. También incorpora datos de demostración optativos para poblar la base local sin sembrarlos accidentalmente en servidores.

## Cambios funcionales

### Movimientos y Kárdex

- `/movimientos` queda como pantalla de registro con accesos para Entrada, Salida, Ajuste, escaneo QR y consulta del Kárdex.
- El Kárdex y la trazabilidad se consultan desde `/reportes`; se conserva la ruta para compatibilidad.
- Se agregó filtrado de movimientos por presentación o insumo, saldo acumulado por presentación, stock actual, paginación y acceso a trazabilidad desde Insumos con el producto preseleccionado.
- Se corrigió el error de render causado por el estado de paginación de trazabilidad (`trazaTotal` indefinido), que dejaba la pantalla en blanco.
- Auditoría vuelve a cargar correctamente sus páginas usando los parámetros de paginación esperados.

### Seeder local

- El catálogo de demostración incluye 25 insumos con presentaciones, rangos de stock, costos sintéticos y movimientos de prueba.
- Los datos demo requieren `APP_SEED_DEMO_DATA=true`; el valor predeterminado es `false` en la aplicación y Compose.
- El seeder omite presentaciones que ya tienen historial de movimientos y conserva las existencias existentes al completar datos faltantes.
- Se añadieron pruebas unitarias para las reglas de siembra.
- Los costos demo son ficticios y no deben tratarse como costos operativos reales.

### Documentación y Git

- Se reorganizó la documentación por tema y se actualizaron los enlaces del README.
- Se documentó la sincronización selectiva de `desa` a `deploy-local`, preservando túnel, scripts y configuración propia del servidor local.

## Validación del release

- Frontend: 73 pruebas Vitest aprobadas; build de producción exitosa.
- Backend: pruebas JUnit/Mockito aprobadas mediante `scripts/test_backend.sh`.
- Docker: builds de las imágenes de backend y frontend exitosas.
- No se inició ni modificó un stack de servicios como parte de la validación.

## Archivos de versión

- `VERSION`: `1.2.0`.
- `frontend/package.json` y `frontend/package-lock.json`: `1.2.0`.
- `backend/build.gradle`: `1.2.0`.
