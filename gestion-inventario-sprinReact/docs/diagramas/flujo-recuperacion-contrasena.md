# Flujo de Recuperación de Contraseña

> **Estado: PROPUESTO** — este flujo aún no está implementado en el sistema. Describe el diseño objetivo para la Fase de Mejoras.

## 1. Diagrama de Flujo (Solicitud de Restablecimiento)

```mermaid
flowchart TD
    A([INICIO: Click en Olvidé mi contraseña]) --> B[Mostrar formulario de correo]
    B --> C[Usuario ingresa su email registrado]
    C --> D[Click: Enviar enlace de recuperacion]

    D --> E[POST /api/auth/recuperar]
    E --> F{El email existe en el sistema?}

    F -->|No| G[Mostrar mensaje generico:<br/>Si el correo existe, recibira un enlace]
    G --> H([FIN: Sin revelar existencia de la cuenta])

    F -->|Si| I[Generar token de recuperacion temporal]
    I --> J[Guardar token con fecha de expiracion]
    J --> K[Enviar email con enlace + token]
    K --> H
```

## 2. Diagrama de Flujo (Restablecimiento de Contraseña)

```mermaid
flowchart TD
    A([INICIO: Usuario abre el enlace del email]) --> B{El token es valido y no esta expirado?}

    B -->|Invalido o expirado| C[Mostrar: enlace invalido o vencido]
    C --> D[Ofrecer reenviar nuevo enlace]
    D --> E([FIN])

    B -->|Valido| F[Mostrar formulario de nueva contrasena]
    F --> G[Ingresa nueva contrasena + confirmacion]
    G --> H{Coinciden y cumple politicas?}

    H -->|No| I[Mostrar error de validacion]
    I --> F

    H -->|Si| J[PUT /api/auth/restablecer-contrasena]
    J --> K[Cifrar nueva contrasena con BCrypt]
    K --> L[Actualizar password en la base de datos]
    L --> M[Invalidar el token de recuperacion]
    M --> N[Mostrar: contrasena actualizada correctamente]
    N --> O[Redirigir al login]
    O --> P([FIN])
```

## 3. Secuencia (Propuesta)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant B as AuthController (Spring)
    participant M as Servicio de Email
    participant D as SQLite

    U->>F: Solicita recuperacion (email)
    F->>B: POST /api/auth/recuperar
    B->>D: Buscar usuario por email
    B->>B: Generar token + expiracion
    B->>M: Enviar enlace con token
    M-->>U: Email recibido
    U->>F: Abre enlace y escribe nueva contrasena
    F->>B: PUT /api/auth/restablecer-contrasena
    B->>B: Valida token + cifra password (BCrypt)
    B->>D: Actualizar password_hash
    B-->>F: 200 Contraseña actualizada
    F->>U: Mensaje de éxito + redirección al login
```

> **Nota:** requiere agregar una dependencia de envío de correo (ej. Spring Mail) y almacenar el token de recuperación (ej. tabla `password_resets`) en el backend.
