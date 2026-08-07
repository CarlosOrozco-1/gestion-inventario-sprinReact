# Conexión a PostgreSQL con DBeaver y pgAdmin

> **Sistema:** SIGES — Sistema de Gestión de Inventarios
> **Base de datos:** PostgreSQL (perfil `prod` del backend)
> **Scripts:** [`database/postgres/`](./01_esquema.sql)

Este documento explica cómo conectarse a la base de datos PostgreSQL de SIGES
desde las dos herramientas de administración más comunes: **DBeaver** y
**pgAdmin**.

---

## 0. ¿Dónde vive PostgreSQL? (modelo servidor → bases de datos)

PostgreSQL usa un modelo de **un solo servidor con muchas bases de datos**
dentro. No es "una conexión por base de datos", sino:

```
1 servidor PostgreSQL (proceso en el puerto 5432)
└── varias bases de datos (cada una con sus tablas)
    ├── inventario   ← la base de SIGES
    ├── postgres     ← base de sistema (no borrar)
    ├── template0    ← plantilla del sistema (no borrar)
    └── template1    ← plantilla del sistema (no borrar)
```

En este proyecto el servidor corre como **contenedor Docker**
(`migracion-springboot-react-db-1`, imagen `postgres:16-alpine`) y expone el
puerto `5432` hacia el equipo. La base de datos propia del sistema es
**`inventario`**; las otras tres (`postgres`, `template0`, `template1`) son
del propio PostgreSQL y siempre existen.

> 💡 En DBeaver se crea **una sola conexión** al servidor y dentro se ven
> todas las bases de datos. Para ver el servidor completo conviene conectar
> con `Database = postgres` (la base de sistema siempre existe) y expandir el
> nodo **Databases**; si prefieres ir directo a la base del proyecto, usa
> `Database = inventario`.

---

## 1. Datos de conexión (valores reales del entorno actual)

Verificados y funcionando en este equipo (Docker + backend en perfil `prod`):

| Parámetro | Valor | Variable de entorno |
| --------- | ----- | ------------------- |
| Host      | `localhost` | `DB_URL`       |
| Puerto    | `5432`      | `DB_URL`       |
| Base      | `inventario` | `DB_URL`       |
| Usuario   | `inventario` | `DB_USERNAME`  |
| Password  | `inventario` | `DB_PASSWORD`  |

> ⚠️ En producción estas credenciales **no** deben ser los valores por defecto;
> se inyectan como variables de entorno de la VM/servidor.

**URL de conexión JDBC:**

```
jdbc:postgresql://localhost:5432/inventario
```

**Verificar con psql dentro del contenedor:**

```bash
docker compose -f docker-compose.prod.yml exec db psql -U inventario -d inventario
```

**Encender/apagar el servidor (Docker):**

```bash
docker compose -f docker-compose.prod.yml up -d db    # encender
docker compose -f docker-compose.prod.yml stop db     # apagar
```

---

## 2. Conectar con DBeaver

DBeaver es una herramienta de escritorio gratuita (edición Community) que
funciona muy bien con PostgreSQL.

1. Abre DBeaver y haz clic en el icono **New Database Connection**
   (un enchufe, arriba a la izquierda).
2. Selecciona **PostgreSQL** y pulsa **Next**.
3. En la pestaña **Settings** rellena los **valores reales**:
   - **Host:** `localhost`.
   - **Port:** `5432`.
   - **Database:** `postgres` (recomendado: ver el servidor completo y todas
     las bases) o `inventario` (ir directo a la base del proyecto).
   - **Username:** `inventario`.
   - **Password:** `inventario`.
4. Marca **Save password locally** si quieres que la recuerde.
5. Pulsa **Test Connection**. Si DBeaver pide descargar el driver, acepta.
   Debe mostrarse *Connection is fine*.
6. Pulsa **Finish**.

**Ver tablas:** si conectaste con `postgres`, expande:
`conexión → Databases → inventario → Schemas → public → Tables`.
Si conectaste con `inventario`: `conexión → Schemas/public → Tables`.

**Ejecutar SQL:** clic derecho en la conexión → **SQL Editor** → **New**.

**Eliminar conexiones viejas/rotas:** clic derecho sobre la conexión →
**Delete** (no borra datos, solo la configuración en DBeaver).

---

## 3. Conectar con pgAdmin

pgAdmin es la herramienta oficial de PostgreSQL.

1. Abre pgAdmin.
2. En el panel **Browser** (izquierda), clic derecho sobre **Servers** →
   **Register → Server**.
3. Pestaña **General**:
   - **Name:** un nombre identificativo, p. ej. `SIGES-Local`.
4. Pestaña **Connection**:
   - **Host name/address:** `localhost`.
   - **Port:** `5432`.
   - **Maintenance database:** `postgres` (base de sistema, siempre existe).
   - **Username:** `inventario`.
   - **Password:** `inventario`.
   - Marca **Save password**.
5. Pulsa **Save**.

**Ver tablas:** `Servers → SIGES-Local → Databases → inventario →
schemas → public → Tables`.

**Ejecutar SQL:** clic derecho sobre la base **inventario** → **Query Tool**.

---

## 4. Recrear el esquema

> ⚠️ **ADVERTENCIA:** recrear **borra** todos los datos. Solo en un ambiente
> de desarrollo/preproducción.

### Con psql (todo en una vez)

```bash
psql -U inventario -h localhost -d inventario -f database/postgres/00_recrear_todo.sql
```

### Con DBeaver o pgAdmin (manual, en orden)

Ejecuta los tres archivos **en orden** (no soportan `\ir`):

1. `01_esquema.sql` — crea las tablas.
2. `02_llaves_foraneas.sql` — agrega las llaves foráneas.
3. `03_indices.sql` — agrega los índices.

---

## 5. Vínculos

- [Esquema](./01_esquema.sql)
- [Llaves foráneas](./02_llaves_foraneas.sql)
- [Índices](./03_indices.sql)
- [Guía de migración SQLite → PostgreSQL](../../docs/MIGRACION_POSTGRESQL.md)