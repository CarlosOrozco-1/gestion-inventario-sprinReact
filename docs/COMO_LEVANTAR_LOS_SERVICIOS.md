# Cómo levantar los servicios (SIGES)

> **Stack:** Backend Spring Boot (API REST) + PostgreSQL + Frontend React (Vite).
> **Estado actual:** los **tres** servicios corren en Docker con un solo comando
> (`docker compose up --build`). El frontend también puede correr con Node en modo
> desarrollo si quieres hot-reload.

---

## 1. Requisitos

| Herramienta | Versión mínima | Verificar con |
| ----------- | -------------- | ------------- |
| Docker + Docker Compose | 24+ / 2.x | `docker --version` |
| Node.js + npm | 20+ | `node --version` (solo modo dev) |
| Git | - | `git --version` |

---

## 2. Configuración inicial (una sola vez)

```bash
# 1) Clonar y entrar al proyecto
git clone <URL-DEL-REPO>
cd migracion-springboot-react

# 2) Crear el archivo de secretos a partir de la plantilla
cp .env.example .env
```

> Edita `.env` y rellena las credenciales reales:
> - `DB_USERNAME` / `DB_PASSWORD`: credenciales de PostgreSQL.
> - `MAIL_USERNAME` / `MAIL_PASSWORD`: cuenta Gmail + contraseña de aplicación
>   (para la recuperación de contraseña). Formato: `xxxx xxxx xxxx xxxx`.

⚠️ `.env` contiene secretos y está en `.gitignore`: **nunca se sube a git**.

---

## 3. Levantar TODO con Docker (frontend + backend + base de datos)

> ⚠️ **Ubicación:** todos los comandos de esta sección se ejecutan desde la
> **raíz del proyecto** (la carpeta que contiene `docker-compose.yml` y
> `docker-compose.prod.yml`, es decir `migracion-springboot-react/`).
> No desde `backend/` ni `frontend/`.

> ⚠️ **IMPORTANTE:** usa SIEMPRE el compose de producción (o el alias por defecto,
> que es idéntico). El backend debe correr con el **perfil `prod`** (PostgreSQL).
> Si lo levantas con un compose antiguo que no inyecta el perfil `prod`, la app
> arrancará con **SQLite** y el envío de correos/recuperación fallará.

```bash
# Construir y levantar los 3 servicios (db, backend, frontend). Aplica Flyway.
docker compose -f docker-compose.prod.yml up -d --build

# Alternativa equivalente: docker-compose.yml por defecto es un alias idéntico
# docker compose up -d --build

# Ver el estado de los contenedores
docker compose -f docker-compose.prod.yml ps

# Ver los logs de cada servicio
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend
```

> Verifica que el backend arrancó con el perfil prod:
> `docker compose -f docker-compose.prod.yml logs backend | grep "1 profile is active"`
> Debe aparecer `The following 1 profile is active: "prod"`. Si ves
> `jdbc:sqlite:...`, el contenedor es viejo: `docker compose -f docker-compose.prod.yml up -d backend`.

- **App completa:** `http://localhost` (Nginx sirve el build de React y proxya `/api` al backend).
- **API directa:** `http://localhost:8080`
- **Base de datos:** `localhost:5432` (usuario/password según `.env`)
- El backend queda **healthy** cuando Flyway aplica el esquema y Hibernate valida.

> 💡 Si ya tienes PostgreSQL del sistema usando el puerto 5432, cambia el
> puerto mapeado en `docker-compose.prod.yml` (ej. `"5433:5432"`).

---

## 4. Modo desarrollo del frontend (opcional, hot-reload)

Si prefieres editar el frontend con recarga en caliente sin reconstruir la imagen
(útil mientras desarrollas), este comando **sí** se ejecuta desde `frontend/`:

```bash
cd migracion-springboot-react/frontend
npm install        # solo la primera vez
npm run dev
```
> La API en este modo es `http://localhost:8080/api` (configurable con
> `VITE_API_URL` en `frontend/.env`).

- **App:** `http://localhost:5173`

---

## 5. Credenciales por defecto

| Rol | Email | Contraseña |
| --- | ----- | ---------- |
| Administrador | `admin@inventario.com` | `admin123` |

> El seeder crea el admin al primer arranque. En producción cambia la contraseña
> y usa cuentas reales (la recuperación de contraseña envía el código al correo).

---

## 6. Detener los servicios

```bash
# Apagar TODOS los servicios (db, backend, frontend). Conserva los datos.
docker compose -f docker-compose.prod.yml down

# Apagar Y borrar datos (¡cuidado!)
docker compose -f docker-compose.prod.yml down -v
```

> Si el frontend corre en modo dev: `Ctrl + C` en su terminal.

---

## 7. Prueba rápida de funcionamiento

```bash
# Login (debe devolver 200 y un token JWT)
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@inventario.com","password":"admin123"}'

# Listar insumos con token
curl http://localhost:8080/api/insumos \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 8. Problemas comunes

| Problema | Solución |
| -------- | -------- |
| `Port 5432 is already in use` | Hay otro PostgreSQL en el host: cambia el puerto en `docker-compose.prod.yml`. |
| El backend usa SQLite (no Postgres) | El contenedor se creó con un compose viejo sin el perfil `prod`. Recrea: `docker compose -f docker-compose.prod.yml up -d backend`. |
| El backend no arranca (Flyway) | Revisa logs: `docker compose -f docker-compose.prod.yml logs backend`. Verifica que el `.env` tenga credenciales correctas. |
| DBeaver no conecta | Host `localhost`, puerto `5432`, base `inventario` (o `postgres` para ver todas), user/pass del `.env`. Ver [`database/postgres/CONEXION_DBEAVER_PGADMIN.md`](../database/postgres/CONEXION_DBEAVER_PGADMIN.md). |
| No llegan correos de recuperación | Verifica `MAIL_USERNAME`/`MAIL_PASSWORD` en `.env` (contraseña de aplicación, no la normal). |
