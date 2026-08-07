# Sistema de Gestion de Inventario de Insumos

Sistema web para el control y gestion de inventario de insumos, con soporte para multiples usuarios y roles (Administrador, Jefe, Auxiliar). Permite registrar entradas, salidas, ajustes y correcciones con validaciones estrictas de stock.

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|------------|---------|
| Backend | Spring Boot | 4.1.0 |
| Persistencia | Spring Data JPA / Hibernate | 7.4.1 |
| Base de Datos | PostgreSQL | 16 |
| Seguridad | Spring Security + JWT | - |
| Build | Gradle | 8.7 |
| Contenedor | Docker / Docker Compose | - |
| Lenguaje | Java | 17 |

---

## Estructura del Proyecto

```
migracion-springboot-react/
├── backend/                  # API REST - Spring Boot
│   ├── src/main/java/
│   │   └── com/gestion/inventario/
│   │       ├── BackendApplication.java
│   │       ├── config/
│   │       ├── controller/
│   │       ├── dto/
│   │       ├── exception/
│   │       ├── model/
│   │       ├── repository/
│   │       ├── security/
│   │       └── service/
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── application-prod.properties
│   │   └── db/migration/        # Migraciones Flyway (PostgreSQL)
│   ├── build.gradle
│   └── Dockerfile
├── database/
│   ├── postgres/                # Esquema PostgreSQL y guías de conexión
│   ├── ER.md                    # Diagrama Entidad-Relacion
│   ├── flujo-sistema.md         # Diagramas de flujo
│   └── casos-uso.md             # Casos de uso y matriz de permisos
├── docs/
│   ├── BITACORA_PROBLEMAS.md
│   ├── COMO_LEVANTAR_LOS_SERVICIOS.md
│   └── FASES_DESARROLLO.md
├── frontend/                    # React + Vite (+ Dockerfile/nginx.conf)
├── docker-compose.yml           # Alias de docker-compose.prod.yml
└── docker-compose.prod.yml      # Produccion (db + backend + frontend)
```

---

## Diagrama Entidad-Relacion

```mermaid
erDiagram
    roles {
        int id PK
        string nombre UK
        int nivel
        string descripcion
    }

    usuarios {
        int id PK
        string nombre
        string email UK
        string password_hash
        int rol_id FK
        int activo
    }

    inventario_insumos {
        int id PK
        int numero
        string insumo
        string presentacion
        string tamano_presentacion
        int stock
        int entrada
    }

    inventario_saldos_mensuales {
        int id PK
        int inventario_id FK
        int anio
        int mes
        int egresos
    }

    inventario_requerimientos_anuales {
        int id PK
        int inventario_id FK
        int anio
        int cantidad
    }

    inventario_movimientos {
        int id PK
        int inventario_id FK
        string tipo
        int usuario_id FK
        int mes
        int anio
        int cantidad
        string detalle
    }

    roles ||--o{ usuarios : "tiene"
    usuarios ||--o{ inventario_movimientos : "realiza"
    inventario_insumos ||--o{ inventario_movimientos : "genera"
    inventario_insumos ||--o{ inventario_saldos_mensuales : "tiene"
    inventario_insumos ||--o{ inventario_requerimientos_anuales : "tiene"
```

---

## Diagrama de Flujo del Sistema

```mermaid
flowchart TD
    A([INICIO]) --> B[Login / Registro]
    B --> C{Seleccionar Rol}

    C -->|Admin| D[Gestionar Usuarios]
    C -->|Admin| E[Gestionar Inventario]
    C -->|Admin| F[Ver Reportes]
    C -->|Admin| G[Asignar Roles]

    C -->|Jefe| H[Consultar Inventario]
    C -->|Jefe| I[Registrar Movimientos]
    C -->|Jefe| J[Ver Reportes]

    C -->|Auxiliar| K[Consultar Inventario]
    C -->|Auxiliar| L[Registrar Movimientos]

    D --> M[Menu Principal]
    E --> M
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N{Modulo}

    N -->|Inventario| O[Ver Insumos]
    N -->|Inventario| P[Agregar Insumo]
    N -->|Inventario| Q[Editar Insumo]
    N -->|Inventario| R[Eliminar Insumo]

    N -->|Movimientos| S[Entradas]
    N -->|Movimientos| T[Salidas]
    N -->|Movimientos| U[Correcciones]
    N -->|Movimientos| V[Ajustes]

    N -->|Reportes| W[Stock Actual]
    N -->|Reportes| X[Movimientos]
    N -->|Reportes| Y[Saldos]
    N -->|Reportes| Z[Requerimientos]

    style A fill:#2ecc71,stroke:#27ae60,color:#fff
    style C fill:#3498db,stroke:#2980b9,color:#fff
    style M fill:#e67e22,stroke:#d35400,color:#fff
    style N fill:#9b59b6,stroke:#8e44ad,color:#fff
```

---

## Flujo de Movimientos

```mermaid
flowchart TD
    A([INICIO]) --> B[Seleccionar Insumo]
    B --> C{Tipo de Movimiento}

    C -->|Entrada| D[stock = stock + cantidad]
    C -->|Salida| E{Validar stock}
    C -->|Ajuste| F[Ajustar cantidad]
    C -->|Correccion| F

    E -->|stock >= cantidad| G[stock = stock - cantidad]
    E -->|stock < cantidad| H[Error: Stock insuficiente]

    D --> I[Registrar Movimiento]
    G --> I
    F --> I
    H --> A

    I --> J[Actualizar Saldo Mensual]
    J --> K([FIN])

    style A fill:#2ecc71,stroke:#27ae60,color:#fff
    style C fill:#3498db,stroke:#2980b9,color:#fff
    style H fill:#e74c3c,stroke:#c0392b,color:#fff
    style K fill:#2ecc71,stroke:#27ae60,color:#fff
```

---

## Flujo de Autenticacion

```mermaid
flowchart TD
    A([INICIO]) --> B[Ingresar Email + Password]
    B --> C{Validar Credenciales}

    C -->|Valido| D[Obtener Rol del Usuario]
    C -->|Invalido| E[Mostrar Error]

    E --> B

    D --> F[Cargar Permisos]
    F --> G[Redirigir a Menu Principal]
    G --> H([FIN])

    style A fill:#2ecc71,stroke:#27ae60,color:#fff
    style C fill:#3498db,stroke:#2980b9,color:#fff
    style E fill:#e74c3c,stroke:#c0392b,color:#fff
    style H fill:#2ecc71,stroke:#27ae60,color:#fff
```

---

## Ejecucion con Docker

> Ejecuta los comandos desde la **raiz del proyecto** (`migracion-springboot-react/`,
> donde estan los `docker-compose*.yml`), no desde `backend/` ni `frontend/`.
>
> Requiere archivo `.env` (crea uno a partir de `.env.example`):
> `cp .env.example .env`

```bash
# Construir y ejecutar los 3 servicios (db + backend + frontend)
docker compose up --build -d

# Ver logs
docker compose logs -f backend

# Detener
docker compose down
```

- **App completa:** `http://localhost` (Nginx sirve el build de React y proxya `/api` al backend)
- **API directa:** `http://localhost:8080`

> El `docker-compose.yml` por defecto es un alias de `docker-compose.prod.yml`;
> ambos son identicos y levantan PostgreSQL + frontend (no SQLite).

---

## Roles y Permisos

| Modulo | Admin | Jefe | Auxiliar |
|--------|:-----:|:----:|:--------:|
| Gestionar usuarios | Si | No | No |
| Agregar insumo | Si | Si | No |
| Editar insumo | Si | Si | No |
| Eliminar insumo | Si | No | No |
| Registrar entrada | Si | Si | Si |
| Registrar salida | Si | Si | Si |
| Registrar ajuste | Si | Si | No |
| Ver inventario | Si | Si | Si |
| Ver reportes | Si | Si | No |
