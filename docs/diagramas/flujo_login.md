# Diagrama de Flujo — Login

**Módulo:** Autenticación
**Endpoints:** `POST /api/auth/login`
**Fase:** 2 (Seguridad y Autenticación)

```mermaid
graph TD
    INICIO([INICIO]) --> A[Usuario abre /login]
    A --> B[Ingresa email y contraseña]
    B --> C{¿Campos válidos?}
    C -->|No| B
    C -->|Sí| D[POST /api/auth/login]

    subgraph Backend - Spring Security
        D --> E[AuthenticationManager.authenticate]
        E --> F[UserDetailsServiceImpl carga usuario por email]
        F --> G{¿Credenciales correctas? <br/> BCrypt: passwordHash]
        G -->|No| H[401 - Credenciales incorrectas]
        G -->|Sí| I[Genera token JWT]
    end

    H --> J[Mostrar error en Login]
    J --> B

    I --> K[Frontend guarda token y usuario en localStorage]
    K --> L[Redirige al Dashboard según rol]
    L --> M{¿Rol del usuario?}
    M -->|ADMIN| N[Acceso a Insumos, Usuarios, Reportes, Ajustes, Proyecciones]
    M -->|JEFE| O[Acceso a Insumos, Movimientos, Reportes, Ajustes, Proyecciones]
    M -->|AUXILIAR| P[Acceso a Insumos y Movimientos]
    N --> FIN([FIN])
    O --> FIN
    P --> FIN

    style INICIO fill:#2ecc71,stroke:#27ae60,color:#fff
    style G fill:#3498db,stroke:#2980b9,color:#fff
    style H fill:#e74c3c,stroke:#c0392b,color:#fff
    style FIN fill:#2ecc71,stroke:#27ae60,color:#fff
```

## Notas

- Las contraseñas se comparan con `BCryptPasswordEncoder`; nunca se guardan en texto plano.
- Si el usuario no está `activo`, el login se rechaza.
- Las credenciales por defecto del seeder: `admin@inventario.com` / `admin123`.
