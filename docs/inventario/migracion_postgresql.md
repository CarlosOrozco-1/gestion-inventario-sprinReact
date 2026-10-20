# Migración de SQLite a PostgreSQL

> **Sistema:** SIGES — Sistema de Gestión de Inventarios
> **Versión del documento:** 1.2
> **Fecha:** 2026-08-02
> **Estado:** ✅ **COMPLETADA** — el sistema opera 100% sobre **PostgreSQL**
> (Flyway + perfil `prod` en Docker); **SQLite fue eliminado del proyecto**
> (dependencias, configuración, esquema y artefactos de migración).

---

## 1. Contexto y Decisión

El sistema está pensado para operar **durante varios años con mantenimiento
continuo**. Actualmente usa **SQLite** (elegido por rapidez de implementación),
pero se evalúa migrar a **PostgreSQL** por:

- **Concurrencia real:** SQLite bloquea toda la base de datos en cada
  escritura; con varios usuarios registrando movimientos a la vez se vuelve
  un cuello de botella.
- **Durabilidad y backups:** PostgreSQL ofrece `pg_dump`, PITR y WAL
  (recuperación a un punto en el tiempo). En SQLite el backup es copiar el
  archivo (frágil si está en uso) y hay riesgo de corrupción ante caídas.
- **Escalamiento a varios años:** millones de filas de movimientos con
  índices sin degradación.

**Decisión:** Migrar a PostgreSQL **ahora**, mientras el acoplamiento a
SQLite es casi nulo y el volumen de datos es pequeño. Migrar en 3 años con
miles de registros sería más caro y riesgoso.

---

## 2. Corrección sobre el hosting gratuito

Oracle Cloud Free Tier **no ofrece PostgreSQL como servicio gestionado**.
Dentro de su capa "Always Free" ofrece:

- **Autonomous Database (base de datos Oracle, NO PostgreSQL):** usaría el
  dialecto Oracle, otra migración.
- **VMs siempre gratis (AMD/ARM Ampere):** aquí se puede **instalar y operar
  PostgreSQL uno mismo** (administración, backups y upgrades por cuenta del
  equipo).

Si se prefiere PostgreSQL **gestionado** sin administrarlo, las alternativas
gratuitas están en otros proveedores (Neon, Supabase, etc.), cada una con
límites de almacenamiento/conexiones.

> **Recomendación:** para producción con datos sensibles de inventario,
> privilegiar **durabilidad y backups** sobre el "gratis eterno". El free
> tier de una VM siempre tendrá límites; planear un presupuesto pequeño a
> mediano plazo.

---

## 3. Patrón Arquitectónico del Proyecto

> Ver el documento completo: **[ARQUITECTURA_PATRONES.md](ARQUITECTURA_PATRONES.md)**.

El backend usa **Arquitectura en Capas (Layered Architecture)**, la evolución
moderna del MVC clásico para APIs REST:

```
Controller (API/REST)
    └── Service (Reglas de negocio, @Transactional)
            └── Repository (Acceso a datos)
                    └── Model/Entity (Datos)
```

**Hallazgo (deuda técnica leve):** las capas no se aplican de forma estricta
en todos los módulos:

- ✅ `MovimientoController` → `MovimientoService` → `MovimientoRepository`.
- ✅ `ItemController` / `InsumoController` / `PresentationController` →
  `ItemService` → `ItemRepository`/`PresentationRepository` (catálogo de
  materiales y presentaciones, incluido el QR).
- ✅ `UsuarioController` → `UsuarioService` → `UsuarioRepository`.
- ✅ `AuthController` → `AuthService`.

No es Clean Architecture ni ports & adapters: no hay casos de uso, interfaces
de puerto ni inyección invertida por dominio. Es un estilo pragmático de
capas, adecuado al tamaño del proyecto.

---

## 4. Análisis de Acoplamiento a SQLite (Bajo)

Tras auditar el código, el acoplamiento a SQLite es **mínimo**:

| Punto                          | Ubicación                                                        | ¿Requiere cambio? |
| ------------------------------ | ---------------------------------------------------------------- | ----------------- |
| URL / driver / dialecto        | `application.properties` (líneas 1-3)                            | Sí (perfil prod)  |
| Dependencias Gradle            | `build.gradle`: `sqlite-jdbc` + `hibernate-community-dialects`   | Sí (agregar postgres) |
| Queries nativas (`@Query`)     | Ninguna                                                          | No                |
| Funciones SQL propietarias     | Ninguna (fechas/formato se hacen en Java)                        | No                |
| Tipos de datos JPA             | `Integer`, `Long`, `BigDecimal`, `LocalDateTime`                 | No (compatibles)  |
| `GenerationType.IDENTITY`      | Todas las entidades                                              | No (compatible con PostgreSQL) |
| Generación de esquema          | `spring.jpa.hibernate.ddl-auto=update` (Hibernate genera DDL)    | Recomendado migrar a Flyway |
| `schema.sql` (referencia)      | `database/schema.sql` (documentación, NO se ejecuta)             | No                |

**Conclusión:** la migración es viable con esfuerzo de **1-2 días**,
incluyendo la migración de datos.

---

## 5. Fases de la Migración

### Fase 1: Línea Base y Preparación — ✅ COMPLETADA
**Objetivo:** dejar el terreno listo **sin cambiar el comportamiento actual**
(SQLite sigue siendo el default).

- [x] Documentar el patrón arquitectónico y el análisis de acoplamiento.
- [x] Agregar el driver `org.postgresql:postgresql` al `build.gradle`.
- [x] Crear el perfil `prod` (`application-prod.properties`) con conexión
      PostgreSQL vía variables de entorno. El perfil **no se activa por
      defecto**, por lo que SQLite local no se ve afectado.
- [x] Pruebas de regresión (frontend `tsc` sin errores nuevos; revisión
      manual de que los módulos actuales siguen funcionando).

### Fase 2: Infraestructura y Configuración PostgreSQL — ✅ COMPLETADA
**Objetivo:** levantar PostgreSQL y conectar la app (perfil `prod`).

- [x] Crear `docker-compose.prod.yml` con servicio `postgres` (volumen
      persistente `pgdata`), healthcheck y credenciales vía variables de
      entorno. **No se modificó `docker-compose.yml`** (el flujo SQLite local
      sigue intacto).
- [x] Configurar el backend en el compose prod para activar
      `SPRING_PROFILES_ACTIVE=prod` y apuntar `DB_URL` al servicio `db`.
- [x] Probar arranque de la app contra una instancia PostgreSQL en blanco
      (Hibernate crea el esquema con `ddl-auto=update`). — **Validado** con el
      contenedor `postgres:16-alpine` del compose: Flyway aplica las
      migraciones y la app arranca sin errores.

### Fase 3: Migración de Datos
**Objetivo:** trasladar los datos actuales de `inventario.db` a PostgreSQL.

- [x] Crear `database/scripts/migrar_sqlite_a_postgres.py`: genera un `.sql` con los
      `INSERT` en el orden correcto de las claves foráneas, convierte los
      timestamps (epoch en ms → `timestamp`), normaliza booleanos y
      restablece las secuencias (`setval`) para no colisionar con
      `GenerationType.IDENTITY`.
- [x] Generar `migracion_postgres.sql` desde `backend/data/inventario.db`
      (artefacto con datos; **no se versiona**).
- [x] Aplicarlo en PostgreSQL y validar:
      `psql -U inventario -h <host> -d inventario -f <SALIDA_SQL>`
- [x] Validar conteos (filas por tabla en origen vs destino) y datos
      críticos (stock, movimientos, usuarios con su rol).
      — **Nota:** la migración de datos se ejecutó y validó; posteriormente
      los artefactos (`migrar_sqlite_a_postgres.py`, `migracion_postgres.sql`,
      `database/schema.sql` y la base `inventario.db`) fueron **eliminados del
      repositorio** al quedar obsoletos.

### Fase 4: Endurecimiento y Mantenimiento
**Objetivo:** convertir la base en una pieza operativa a largo plazo.

Esquema de referencia PostgreSQL:
[`database/postgres/`](../database/postgres/) — `01_esquema.sql`,
`02_llaves_foraneas.sql`, `03_indices.sql`, `00_recrear_todo.sql`.
Guía de conexión para DBeaver/pgAdmin:
[`CONEXION_DBEAVER_PGADMIN.md`](../database/postgres/CONEXION_DBEAVER_PGADMIN.md).

- [x] **Flyway** para versionar el esquema: dependencias `flyway-core` +
      `flyway-database-postgresql`; migración `db/migration/V1__esquema_inicial.sql`
      (tablas + llaves foráneas + índices); el perfil `prod` pasa de
      `ddl-auto=update` a `ddl-auto=validate` con `spring.flyway.enabled=true`.
      El perfil **default (SQLite)** mantiene `ddl-auto=update` y
      `spring.flyway.enabled=false`, así el desarrollo no se ve afectado.
- [x] Probar arranque con perfil `prod` contra instancia PostgreSQL en blanco
      (Flyway aplica V1 y Hibernate valida el esquema).
      — **Validado:** el backend corre con `SPRING_PROFILES_ACTIVE=prod` sobre
      PostgreSQL y Flyway aplica `V1__esquema_inicial.sql` y
      `V2__password_reset_tokens.sql` sin errores (luego `V3__presentaciones_multiples.sql`,
      `V4__normalizar_schema_al_ingles.sql` y `V5__add_qr_code_to_presentations.sql`).
- [x] **Backups automáticos:** `database/scripts/backup_postgres.sh` (`pg_dump`
      -Fc con rotación de `BACKUP_KEEP` días) y `database/scripts/restore_postgres.sh`
      (restauración con `--clean --if-exists`). Ejemplo de cron incluido en el
      encabezado del script.
- [x] **Índices** para consultas frecuentes (movimientos por insumo/usuario/
      fecha; saldos y requerimientos por búsqueda) — ver `03_indices.sql` y la
      migración V1 de Flyway.
- [x] **Seguridad por rol a nivel de API** con `@PreAuthorize`
      (`@EnableMethodSecurity` activado en `SecurityConfig`). Matriz aplicada:
      - Insumos: lectura para ADMIN/JEFE/AUXILIAR (necesaria para movimientos,
        reportes y proyecciones); **crear/editar solo ADMIN**.
      - Movimientos: ADMIN/JEFE/AUXILIAR.
      - Reportes (excel/pdf): ADMIN/JEFE/AUXILIAR; **Proyecciones: ADMIN/JEFE**.
      - Usuarios (todo el CRUD): **solo ADMIN**.
      Las autoridades vienen del JWT como `ROLE_<NOMBRE>` (ver
      `UserDetailsServiceImpl`).

### Fase 5: Pruebas Integrales y Puesta en Marcha
**Objetivo:** validar que el sistema migrado funciona de punta a punta.

- [x] Smoke test completo con rol ADMIN: login, insumos, movimientos,
      ajustes, reportes PDF/Excel, proyecciones, usuarios.
      — **Validado:** `scripts/smoke_test_e2e.py` (56+ aserciones, 0 fallos);
      incluye el flujo de códigos QR (Fases 20-23). Limpieza de datos de
      prueba con `scripts/limpiar_e2e.sql`.
- [x] Prueba con roles JEFE y AUXILIAR (menú y rutas según matriz de acceso).
      — **Validado:** el E2E verifica rechazos 401/403 por rol en endpoints
      protegidos (`@PreAuthorize`).
- [ ] Prueba de concurrencia (dos usuarios registrando movimientos a la vez).
- [x] Despliegue en la infraestructura elegida y monitoreo inicial.
      — **Validado:** despliegue "todo en Docker" (`docker compose up --build`):
      db + backend + frontend (Fase 14).

---

## 6. Archivos que se Modifican (Resumen por Fase)

| Fase | Archivo                        | Cambio                                            |
| ---- | ------------------------------ | ------------------------------------------------- |
| 1    | `backend/build.gradle` | + driver `org.postgresql:postgresql`              |
| 1    | `backend/.../application-prod.properties` | **Nuevo** perfil PostgreSQL (env vars)  |
| 2    | `docker-compose.prod.yml` | **Nuevo** compose de producción (Postgres + backend) |
| 2    | `backend/Dockerfile`           | activar perfil `prod` (si aplica)                 |
| 3    | `database/scripts/migrar_sqlite_a_postgres.py` | **Nuevo** generador de SQL de migración |
| 3    | `database/scripts/migracion_postgres.sql` | **Generado** (datos, sin versionar)      |
| 4    | `database/postgres/`           | **Nuevo** esquema de referencia (01/02/03/00)       |
| 4    | `database/postgres/CONEXION_DBEAVER_PGADMIN.md` | Guía de conexión DBeaver/pgAdmin |
| 4    | `backend/build.gradle`                 | + `flyway-core` + `flyway-database-postgresql` |
| 4    | `backend/src/main/resources/db/migration/V1__esquema_inicial.sql` | Migración Flyway |
| 4    | `application.properties`       | `spring.flyway.enabled=false` (dev SQLite)      |
| 4    | `application-prod.properties`  | `ddl-auto=validate` + `spring.flyway.enabled=true` |
| 4    | `database/scripts/backup_postgres.sh` / `database/scripts/restore_postgres.sh` | **Nuevos** backup/restore (`pg_dump`) |

---

## 7. Checklist de Regresión (para no perder lo existente)

> **Estado:** todos los puntos validados sobre el stack final (PostgreSQL).

- [x] Build del backend (`./gradlew build`) sin errores (12 tests unitarios OK).
- [x] Arranque sobre PostgreSQL (perfil `prod` vía Docker) y login con
      `admin@inventario.com`.
- [x] CRUD de insumos (crear, editar, listar).
- [x] Registrar movimiento ENTRADA y SALIDA; verificar stock y kárdex.
- [x] Ajuste con justificación (módulo Auditoría).
- [x] Reportes PDF y Excel (descarga sin errores).
- [x] Proyecciones (cálculo e inversión en Quetzales) + sugerencias de stock.
- [x] Gestión de usuarios (crear, editar, suspender y cambiar rol).
- [x] Menú y rutas por rol (ADMIN / JEFE / AUXILIAR).
