# Flujo de Login

Flujo real del inicio de sesión: pantalla dividida con **credenciales** o **Google OAuth**, accesos rápidos por rol y guard de rutas con JWT.

## 1. Diagrama de Flujo (Login con Credenciales)

```mermaid
flowchart TD
    A([INICIO: Visita /login]) --> B[Render pantalla dividida]

    %% Opcion accesos rapidos
    B --> B1[Click en acceso rapido de rol]
    B1 --> B2[Autollenar email y password en el formulario]

    %% Formulario
    B --> C[Ingresa correo y contrasena]
    C --> D[Click: Ingresar al Sistema]
    D --> E[POST /api/auth/login]

    E --> F{Validar credenciales}
    F -->|Credenciales invalidas| G[Mostrar mensaje de error en pantalla]
    G --> C

    F -->|Credenciales validas| H[Generar Token JWT]
    H --> I[Guardar jwt_token y user_info en localStorage]
    I --> J[Redirigir a /dashboard]
    J --> K([FIN: Sesion iniciada])
```

## 2. Diagrama de Flujo (Login con Google)

```mermaid
flowchart TD
    A([INICIO: Click en Continuar con Google]) --> B{Origen autorizado?}

    B -->|"Origen (http://localhost:5173) no autorizado"| C["GSI: 403 - The given origin is not allowed"]
    C --> D[Mostrar error: cuenta no disponible]
    D --> E([FIN])

    B -->|Origen autorizado| F[GSI muestra selector de cuenta Google]
    F --> G{Usuario selecciona cuenta}
    G -->|Cancela| H[Mostrar: autenticacion cancelada]
    H --> E

    G -->|Selecciona cuenta| I[Obtener credential (ID Token)]
    I --> J[POST /api/auth/google con credential]
    J --> K{Backend valida ID Token<br/>audiencia + email verificado}
    K -->|Invalido| L[401: No se pudo validar identidad]
    L --> E

    K -->|Valido| M{Email registrado y activo?}
    M -->|No existe o inactivo| N[403: cuenta no registrada]
    N --> E

    M -->|Existe y activo| O[Generar Token JWT propio]
    O --> P[Guardar sesion en localStorage]
    P --> Q[Redirigir a /dashboard]
    Q --> E
```

## 3. Guard de Rutas (Protección del Dashboard)

```mermaid
flowchart TD
    A([Navegador solicita ruta protegida]) --> B{Existe jwt_token en localStorage?}

    B -->|No| C[Navegar a /login]
    C --> D([FIN])

    B -->|Si| E{El token es valido?}
    E -->|No| F[Limpiar sesion y redirigir a /login]
    F --> D

    E -->|Si| G[Renderizar el Dashboard]
    G --> D
```

## 4. Secuencia (Login con credenciales)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Login.jsx (React)
    participant A as AuthContext
    participant B as AuthController (Spring)
    participant D as SQLite

    U->>F: Llena correo + password
    F->>A: login(email, password)
    A->>B: POST /api/auth/login
    B->>D: findByEmail
    D-->>B: Usuario (con rol)
    B->>B: authenticationManager.authenticate (BCrypt)
    B-->>A: 200 { token, user {id, nombre, email, rol, nivel} }
    A->>A: localStorage: jwt_token + user_info
    A-->>F: success
    F->>U: Navega al Dashboard
```
