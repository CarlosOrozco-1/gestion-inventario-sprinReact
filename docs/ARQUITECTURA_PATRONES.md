# Arquitectura y Patrones de Diseño del Sistema

> **Sistema:** SIGES — Sistema de Gestión de Inventarios
> **Versión:** 1.0
> **Fecha:** 2026-08-02
> **Propósito:** Documentar el patrón arquitectónico y los patrones de diseño
> utilizados, para facilitar el mantenimiento y la incorporación de nuevos
> desarrolladores.

---


## 2. Arquitectura del Sistema

### 2.1 Vista General

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                        │
│  Componentes UI → Hooks → Zustand (estado) → axios (API)       │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP/JSON (JWT en Authorization)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND (Spring Boot)                   │
│  ┌─────────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │ Controller  │──▶│   Service    │──▶│    Repository     │   │
│  │ (API/REST)  │   │(Reglas, txn) │   │(Spring Data JPA)  │   │
│  └─────────────┘   └──────────────┘   └────────┬──────────┘   │
│          ▲                                     │              │
│          │  Model/Entity (Usuario, Insumo,     ▼              │
│          │  Movimiento, SaldoMensual, ...)   ┌──────────┐     │
│          │  viajan a través de las capas     │  Base de │     │
│          └──────────────────────────────────▶│  Datos   │     │
│                                               │PostgreSQL│     │
│                                               └──────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de una petición

1. **React** envía una petición HTTP con Axios (token JWT en el header
   `Authorization`).
2. **JwtAuthenticationFilter** valida el token (cadena de filtros de Spring
   Security).
3. **Controller** recibe el `@RequestBody` y lo valida.
4. **Service** aplica las reglas de negocio (validaciones, cálculos de
   stock, `@Transactional`).
5. **Repository** (Spring Data JPA) traduce a SQL y accede a la base.
6. La respuesta viaja de vuelta en JSON; los errores se formatean en
   `GlobalExceptionHandler` (`@RestControllerAdvice`).

### 2.3 Estructura de paquetes (backend)

```
com.gestion.inventario
├── controller/   # Capa de presentación (REST endpoints)
├── service/      # Capa de negocio (reglas, transacciones)
├── repository/   # Capa de datos (interfaces Spring Data JPA)
├── model/        # Entidades JPA (tablas)
├── dto/          # Objetos de transferencia (petición/respuesta)
├── security/     # JWT, autenticación, filtros
├── config/       # Configuración (Security, CORS, Seeder)
└── exception/    # Manejo global de errores
```

### 2.4 Estructura (frontend)

```
frontend/src
├── pages/        # Vistas por módulo (Dashboard, Insumos, Movimientos...)
├── components/   # Componentes reutilizables (Layout, Modales, Guards)
├── store/        # Zustand (estado global de autenticación)
├── api/          # Cliente axios + interceptores (JWT)
└── access.ts     # Matriz de acceso por rol (ACL)
```

---

## 3. Patrones de Diseño Utilizados

### 3.1 Backend (Spring Boot)

| Patrón                                   | Uso en el proyecto                                        |
| ---------------------------------------- | --------------------------------------------------------- |
| **Layered Architecture**                 | Separación Controller / Service / Repository / Model.     |
| **Repository (DAO)**                     | Interfaces `*Repository extends JpaRepository`.           |
| **DTO (Data Transfer Object)**           | `LoginResponse`, `MovimientoDTO`, `ProyeccionDTO`, `NuevoUsuarioDTO`. |
| **Inyección de Dependencias (IoC)**      | Contenedor Spring: `@Autowired` e inyección por constructor. |
| **Singleton**                            | Beans de Spring (scope por defecto).                      |
| **Template Method**                      | `JpaRepository` ofrece CRUD predefinido; filtros de Spring Security. |
| **Chain of Responsibility / Filtro**     | `JwtAuthenticationFilter` en la cadena de seguridad.      |
| **Controller Advice (manejo global)**    | `GlobalExceptionHandler` con `@RestControllerAdvice`.     |
| **Strategy (parcial)**                   | `MovimientoService` con `switch` por tipo de movimiento (candidato a refactor). |
| **Builder / Data**                       | Lombok (`@Data`, `@AllArgsConstructor`) para entidades y DTOs. |

### 3.2 Frontend (React)

| Patrón                                | Uso en el proyecto                                    |
| ------------------------------------- | ----------------------------------------------------- |
| **Component-Based Architecture**      | Componentes funcionales de React.                     |
| **Hooks**                             | `useState`, `useEffect`, `useMemo`, custom hooks.     |
| **State Management (Zustand)**        | `useAuthStore` para sesión/autenticación.             |
| **API Client (capa de servicio)**     | `api/axios.ts` con interceptores (adjunta el JWT).    |
| **Router (SPA)**                      | React Router DOM v6 con rutas protegidas por rol.     |
| **Guard de rutas**                    | `ProtectedRoute` (autenticado) y `RequireRole` (rol). |

---

## 4. Decisiones de Diseño y Deuda Técnica

- **Base de datos intercambiable:** JPA abstrae la base (PostgreSQL en
  todos los entornos) → la arquitectura es portable a otro motor si hiciera falta.
- **`ddl-auto=update`:** genera el esquema automáticamente, pero en
  producción a largo plazo conviene **Flyway/Liquibase** + `ddl-auto=validate`.
- **`InsumoController` omite la capa Service** (usa el Repository directo).
  Para consistencia, las reglas de negocio de insumos deberían moverse a un
  `InsumoService`.
- **`MovimientoService` usa un `switch` por tipo de movimiento:** funciona,
  pero si crecen los tipos, conviene aplicar el patrón **Strategy**.
- **No hay capa de mapeo DTO→Entidad explícita** (los controllers arman las
  respuestas a mano). Con más DTOs, evaluar **MapStruct**.
- **Seguridad por rol solo en la UI:** los endpoints no validan el rol
  (`@PreAuthorize` pendiente).

---

## 5. Guía Rápida de Mantenimiento

### Agregar un módulo nuevo (ej. "Categorías")

1. **Backend:** entidad `model/Categoria.java` → `repository/CategoriaRepository.java`
   → `service/CategoriaService.java` (reglas) → `controller/CategoriaController.java`.
2. **Frontend:** `pages/Categorias.tsx` → ruta en `App.tsx` → enlace en
   `Layout.tsx` → acceso por rol en `access.ts` (y `RequireRole` si aplica).
3. **Documentación:** actualizar la matriz de `docs/ACCESOS_ROLES_MODULOS.md`.

### Regla de oro para no romper nada

- Mantener el patrón de capas: el Controller **nunca** toca la base de datos
  directo si existe una regla de negocio de por medio.
- Cada cambio de comportamiento se valida con el checklist de regresión de
  `docs/MIGRACION_POSTGRESQL.md` (sección 7).
