# Guia para levantar servicios, puertos y build

Documento de referencia para levantar el backend y el frontend del sistema de gestion de inventario, conocer los puertos de acceso y ejecutar las builds de produccion.

## Estructura

```
gestion-inventario-sprinReact/
├── backend/                  # API REST - Spring Boot (Java 17, Gradle 8.7)
├── frontend/                 # SPA - React 19 + Vite
├── database/
│   └── schema.sql            # Esquema SQL (SQLite)
├── docs/
├── docker-compose.yml        # Servicio backend (Spring Boot)
└── README.md
```

## Requisitos previos

| Herramienta | Version recomendada | Proposito |
|-------------|--------------------|-----------|
| Docker + Docker Compose | Docker 24+, Compose v2 | Backend (Spring Boot) |
| Node.js | 18+ (recomendado 20+) | Frontend (Vite) |
| npm | incluido con Node.js | Dependencias del frontend |

## 1. Backend (Spring Boot)

### Opcion A: Con Docker (recomendada)

Desde la raiz del proyecto (`gestion-inventario-sprinReact/`):

```bash
# Construir la imagen y levantar el contenedor
docker compose up --build -d

# Ver logs
docker compose logs -f backend

# Detener
docker compose down
```

- La API queda disponible en `http://localhost:8080`.
- La base de datos SQLite se guarda en `backend/data/inventario.db` (volumen montado en `/app/data`).
- Credenciales de administrador por defecto (creadas por `DataSeeder`):
  - Email: `admin@inventario.com`
  - Password: `admin123`

### Opcion B: Local (sin Docker)

```bash
cd backend
./gradlew bootRun
```

Tambien `http://localhost:8080`.

## 2. Frontend (React + Vite)

### Instalacion de dependencias

```bash
cd frontend
npm install
```

### Levantar en desarrollo (dev server)

```bash
npm run dev
```

- El frontend queda disponible en `http://localhost:5173` (puerto por defecto de Vite).
- Se conecta al backend mediante `http://localhost:8080/api` (definido en `frontend/src/services/api.js`). El backend debe estar corriendo en el puerto 8080.

### Build de produccion

```bash
npm run build
```

- Genera los archivos estaticos en `frontend/dist/`.
- Se pueden servir con cualquier servidor estatico o con `npm run preview` (el preview usa el puerto `4173` por defecto).

### Lint

```bash
npm run lint
```

## 3. Resumen de puertos

| Servicio | URL de acceso | Puerto | Notas |
|----------|---------------|--------|-------|
| Backend (Spring Boot) | `http://localhost:8080` | 8080 | API REST, expuesto en Docker (`8080:8080`) |
| Frontend (dev) | `http://localhost:5173` | 5173 | Vite dev server |
| Frontend (preview) | `http://localhost:4173` | 4173 | `npm run preview` sobre `dist/` |

## 4. Variables de entorno

| Archivo | Variable | Descripcion |
|---------|----------|-------------|
| `backend/src/main/resources/application.properties` | `GOOGLE_CLIENT_ID` | Id del cliente OAuth de Google (login con Google). Tiene valor por defecto. |
| `frontend/.env` | `VITE_GOOGLE_CLIENT_ID` | Id del cliente OAuth de Google usado por el frontend. |

La API del frontend apunta a `http://localhost:8080/api` de forma fija en `frontend/src/services/api.js`. Si el backend corriera en otro puerto, actualizar esa URL.

## 5. Pasos rapidos (todo junto)

```bash
# Terminal 1: backend
docker compose up --build -d

# Terminal 2: frontend
cd frontend
npm install
npm run dev
```

Abrir `http://localhost:5173` y acceder con las credenciales de admin.