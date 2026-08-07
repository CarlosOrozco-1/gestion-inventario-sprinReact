# Diagrama de Flujo — Recuperación de Contraseña

**Módulo:** Autenticación
**Endpoints:** `POST /api/auth/recuperar`, `POST /api/auth/verificar-codigo`, `POST /api/auth/restablecer`
**Fase:** 12 (Recuperación de Contraseña)

```mermaid
graph TD
    INICIO([INICIO]) --> A[Login - Clic en ¿Olvidaste tu contraseña?]
    A --> B[Paso 1 - Ingresar email]

    subgraph Backend - POST /api/auth/recuperar
        B --> C[Buscar usuario por email]
        C --> D{¿Email registrado?}
        D -->|No| E[No hacer nada - respuesta genérica]
        D -->|Sí| F[Generar código de 6 dígitos]
        F --> G[Hash BCrypt del código]
        G --> H[Invalidar tokens previos]
        H --> I[Guardar token: expiración 10 min, intentos 0]
        I --> J[Enviar correo con JavaMailSender Gmail SMTP]
    end

    E --> K[Respuesta genérica: <br/> Si el correo está registrado, recibirás un código]
    J --> K
    K --> L[Paso 2 - Ingresar código]

    subgraph Backend - POST /api/auth/verificar-codigo
        L --> M{¿Código correcto? <br/> BCrypt matches}
        M -->|No| N[Incrementar intentos fallidos]
        N --> O{¿Alcanzó 5 intentos?}
        O -->|Sí| P[Invalidar token - solicitar uno nuevo]
        O -->|No| Q[400 - Código incorrecto]
        Q --> L
        P --> A
        M -->|Sí| R{¿Token vencido?}
        R -->|Sí| S[400 - Código expirado]
        R -->|No| T{¿Token ya usado?}
        T -->|Sí| U[400 - Código ya utilizado]
        T -->|No| V[Código válido - avanzar]
    end

    S --> A
    U --> A
    V --> W[Paso 3 - Nueva contraseña min 8 y confirmar]

    subgraph Backend - POST /api/auth/restablecer
        W --> X[Validar código de nuevo]
        X --> Y[Actualizar password_hash con BCrypt]
        Y --> Z[Marcar token como usado]
    end

    Z --> AA[Redirigir a Login]
    AA --> AB[Iniciar sesión con la nueva contraseña]
    AB --> FIN([FIN])

    style INICIO fill:#2ecc71,stroke:#27ae60,color:#fff
    style D fill:#3498db,stroke:#2980b9,color:#fff
    style M fill:#f39c12,stroke:#e67e22,color:#fff
    style N fill:#e74c3c,stroke:#c0392b,color:#fff
    style FIN fill:#2ecc71,stroke:#27ae60,color:#fff
```

## Notas de Seguridad

- **Respuesta genérica:** el endpoint `/recuperar` nunca revela si el email existe (mitiga enumeración de cuentas).
- El código se guarda **hasheado con BCrypt**, nunca en texto plano.
- Expiración de **10 minutos** y máximo **5 intentos fallidos** (anti fuerza bruta).
- Cada código es de un solo uso; al solicitar uno nuevo se invalidan los anteriores.
- Credenciales SMTP desde `.env` (`MAIL_USERNAME`, `MAIL_PASSWORD`); nunca en el repositorio.
