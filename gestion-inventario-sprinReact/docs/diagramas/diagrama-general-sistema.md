# Diagrama General del Sistema

## 1. Arquitectura del Sistema (Componentes)

```mermaid
flowchart LR
    subgraph Cliente["FRONTEND (React + Vite) - Puerto 5173"]
        UI[Paginas y Componentes]
        AUTH[AuthContext<br/>gestiona sesion / JWT]
        AX[Axios API Interceptor<br/>inyecta Authorization Bearer]
        LOGIN[Pagina Login]
        DASH[Dashboard + Modulos]
    end

    subgraph Servidor["BACKEND (Spring Boot) - Puerto 8080"]
        SEC[Spring Security<br/>Filtro JWT]
        CTRL[Controllers<br/>/api/...]
        SVC[Services<br/>reglas de negocio]
        REPO[Repositories<br/>JPA / Hibernate]
    end

    DB[("Base de Datos<br/>SQLite (inventario.db)")]

    UI --> LOGIN
    LOGIN --> AUTH
    AUTH --> DASH
    DASH --> AX
    AX -->|"HTTP + JWT"| SEC
    SEC --> CTRL
    CTRL --> SVC
    SVC --> REPO
    REPO --> DB

    style Cliente fill:#0b0f19,stroke:#3b82f6,color:#f9fafb
    style Servidor fill:#0b0f19,stroke:#10b981,color:#f9fafb
    style DB fill:#111827,stroke:#f59e0b,color:#f9fafb
```

## 2. Flujo General del Sistema (por Rol)

```mermaid
flowchart TD
    A([INICIO]) --> B[Acceso al Sistema]
    B --> C[Login<br/>credenciales o Google]

    C -->|Token JWT valido| D{Identificar Rol}

    D -->|ADMIN| E[Menu Principal]
    D -->|JEFE| E
    D -->|AUXILIAR| E

    E --> F{Seleccionar Modulo}

    %% Roles con acceso a cada modulo
    F -->|"Resumen / Catalogo Insumos"| G[Ver y gestionar insumos]
    F -->|Movimientos| H[Registrar Entradas / Salidas / Ajustes]
    F -->|"Alertas de Stock"| I[Ver insumos criticos / agotados]
    F -->|Bitacora| J[Consultar registro de auditoria]
    F -->|"Usuarios y Permisos"| K[Gestionar usuarios y roles]

    %% Restricciones por rol
    K --> K1{Es ADMIN?}
    K1 -->|Si| K2[CRUD de usuarios y permisos]
    K1 -->|No| K3[Acceso denegado - 403]

    G --> L([FIN / Retorno al menu])
    H --> L
    I --> L
    J --> L
    K2 --> L

    style A fill:#2ecc71,stroke:#27ae60,color:#fff
    style C fill:#3498db,stroke:#2980b9,color:#fff
    style D fill:#e67e22,stroke:#d35400,color:#fff
    style K3 fill:#e74c3c,stroke:#c0392b,color:#fff
```

## 3. Acceso por Rol a los Módulos (matriz real del Dashboard)

```mermaid
flowchart LR
    subgraph Modulos
        M1[Resumen]
        M2[Insumos]
        M3[Movimientos]
        M4[Alertas]
        M5[Bitacora]
        M6[Usuarios]
    end

    ADMIN --> M1
    ADMIN --> M2
    ADMIN --> M3
    ADMIN --> M4
    ADMIN --> M5
    ADMIN --> M6

    JEFE --> M1
    JEFE --> M2
    JEFE --> M3
    JEFE --> M4
    JEFE --> M5

    AUX --> M1
    AUX --> M2
    AUX --> M3

    style ADMIN fill:#e74c3c,stroke:#c0392b,color:#fff
    style JEFE fill:#3498db,stroke:#2980b9,color:#fff
    style AUX fill:#2ecc71,stroke:#27ae60,color:#fff
```

## 4. Autenticación y Sesión (JWT)

```mermaid
sequenceDiagram
    participant U as Usuario (Navegador)
    participant F as Frontend (React)
    participant B as Backend (Spring Boot)
    participant D as Base de Datos (SQLite)

    U->>F: Ingresa credenciales / Google
    F->>B: POST /api/auth/login o /api/auth/google
    B->>D: Buscar usuario por email
    D-->>B: Usuario + rol + permisos
    B->>B: Validar credenciales (BCrypt)
    B-->>F: 200 { token JWT, datos del usuario }
    F->>F: Guardar jwt_token y user_info (localStorage)
    F->>B: GET /api/... con header Authorization: Bearer <token>
    B->>B: Filtro JWT valida token
    B-->>F: 200 Respuesta (insumos, movimientos, etc.)
    F->>U: Muestra el Dashboard

    Note over B: Sin token valido -> 403 / Redirige a /login
```
