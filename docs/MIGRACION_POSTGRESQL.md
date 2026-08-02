# Migración de SQLite a PostgreSQL

> **Sistema:** SIGES — Sistema de Gestión de Inventarios
> **Versión del documento:** 1.0
> **Fecha:** 2026-08-02
> **Estado:** En curso — Fase 1 completada

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
- ⚠️ `InsumoController` → `InsumoRepository` directamente (se salta la capa
  `Service`). Las reglas de insumos (cálculo de stock, validaciones) deberían
  vivir en un `InsumoService`.

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
- [ ] Probar arranque de la app contra una instancia PostgreSQL en blanco
      (Hibernate crea el esquema con `ddl-auto=update`). — **Pendiente de
      ejecutar** (requiere una instancia PostgreSQL).

### Fase 3: Migración de Datos
**Objetivo:** trasladar los datos actuales de `inventario.db` a PostgreSQL.

- [x] Crear `scripts/migrar_sqlite_a_postgres.py`: genera un `.sql` con los
      `INSERT` en el orden correcto de las claves foráneas, convierte los
      timestamps (epoch en ms → `timestamp`), normaliza booleanos y
      restablece las secuencias (`setval`) para no colisionar con
      `GenerationType.IDENTITY`.
- [x] Generar `migracion_postgres.sql` desde `backend/data/inventario.db`
      (artefacto con datos; **no se versiona**).
- [ ] Aplicarlo en PostgreSQL y validar:
      `psql -U inventario -h <host> -d inventario -f <SALIDA_SQL>`
- [ ] Validar conteos (filas por tabla en origen vs destino) y datos
      críticos (stock, movimientos, usuarios con su rol).

### Fase 4: Endurecimiento y Mantenimiento
**Objetivo:** convertir la base en una pieza operativa a largo plazo.

- [ ] Introducir **Flyway/Liquibase** para versionar el esquema y pasar de
      `ddl-auto=update` a `ddl-auto=validate`.
- [ ] Programar **backups automáticos** (`pg_dump` + cron) y definir una
      estrategia de restauración.
- [ ] Crear índices para las consultas frecuentes (movimientos por insumo,
      por usuario, por fecha).
- [ ] Reforzar endpoints del backend con `@PreAuthorize` (seguridad por rol
      a nivel de API).

### Fase 5: Pruebas Integrales y Puesta en Marcha
**Objetivo:** validar que el sistema migrado funciona de punta a punta.

- [ ] Smoke test completo con rol ADMIN: login, insumos, movimientos,
      ajustes, reportes PDF/Excel, proyecciones, usuarios.
- [ ] Prueba con roles JEFE y AUXILIAR (menú y rutas según matriz de acceso).
- [ ] Prueba de concurrencia (dos usuarios registrando movimientos a la vez).
- [ ] Despliegue en la infraestructura elegida y monitoreo inicial.

---

## 6. Archivos que se Modifican (Resumen por Fase)

| Fase | Archivo                        | Cambio                                            |
| ---- | ------------------------------ | ------------------------------------------------- |
| 1    | `backend/build.gradle` | + driver `org.postgresql:postgresql`              |
| 1    | `backend/.../application-prod.properties` | **Nuevo** perfil PostgreSQL (env vars)  |
| 2    | `docker-compose.prod.yml` | **Nuevo** compose de producción (Postgres + backend) |
| 2    | `backend/Dockerfile`           | activar perfil `prod` (si aplica)                 |
| 3    | `scripts/migrar_sqlite_a_postgres.py` | **Nuevo** generador de SQL de migración |
| 3    | `scripts/migracion_postgres.sql` | **Generado** (datos, sin versionar)      |
| 4    | `build.gradle`                 | + `flyway-core` (o liquibase)                     |
| 4    | `db/migration/`                | scripts versionados de esquema                    |
| 4    | `application-prod.properties`  | `ddl-auto=validate`, credenciales seguras         |

---

## 7. Checklist de Regresión (para no perder lo existente)

Antes y después de cada fase, validar que **no se haya roto nada**:

- [ ] Build del backend (`./gradlew build`) sin errores.
- [ ] Arranque con perfil default (SQLite) y login con `admin@inventario.com`.
- [ ] CRUD de insumos (crear, editar, listar).
- [ ] Registrar movimiento ENTRADA y SALIDA; verificar stock y kárdex.
- [ ] Ajuste con justificación (módulo Auditoría).
- [ ] Reportes PDF y Excel (descarga sin errores).
- [ ] Proyecciones (cálculo e inversión en Quetzales).
- [ ] Gestión de usuarios (crear y suspender).
- [ ] Menú y rutas por rol (ADMIN / JEFE / AUXILIAR).
