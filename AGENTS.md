# AGENTS.md — Migración a Spring Boot + React

> **Proyecto:** Sistema de Gestión de Inventario de Insumos (V2)
> **Stack Nuevo:** Spring Boot (Java) + React + PostgreSQL
> **Objetivo:** Sistema ultra-preciso para el manejo de entradas, salidas y ajustes justificados, con validaciones estrictas y arquitectura orientada a transacciones seguras.

---

## 1. Tecnologías a utilizar

### Backend (Spring Boot)
- **Framework:** Spring Boot 3.x (Java 17 o 21).
- **Persistencia:** Spring Data JPA / Hibernate.
- **Base de Datos:** PostgreSQL (producción vía Docker + Flyway; el sistema ya NO usa SQLite).
- **Seguridad:** Spring Security + JWT (JSON Web Tokens).
- **Manejo de Errores:** `@RestControllerAdvice` para centralización de excepciones.
- **Precisión Numérica:** **ESTRICTAMENTE** usar `BigDecimal` o `Integer` (si no hay decimales) para todo cálculo de cantidades/dinero. **Prohibido usar `float` o `double`** por problemas de precisión en coma flotante.

### Frontend (React)
- **Librería principal:** React 18+ (Functional Components + Hooks).
- **Manejo de Estado:** Zustand o Redux Toolkit.
- **Enrutamiento:** React Router Dom v6.
- **Peticiones:** Axios o Fetch nativo con Interceptors para manejar el JWT.
- **UI:** Tailwind CSS + Componentes tipo shadcn/ui o Material UI.

---

## 2. Fases del Proyecto

1. **Fase 1: Setup y Modelado de Datos**
   - Inicializar Spring Boot y migrar el esquema SQL (`schema.sql`) a Entidades JPA.
   - Configurar la conexión a la base de datos.
2. **Fase 2: Seguridad y Autenticación**
   - Implementar login, generación de JWT y roles (Admin, Jefe, Auxiliar).
3. **Fase 3: Módulo Base (Insumos)**
   - CRUD de catálogo de insumos (Solo creación/edición, no borrado físico si tiene movimientos).
4. **Fase 4: Motor Transaccional (Movimientos)**
   - Desarrollo de lógica de entradas, salidas y validaciones estrictas de stock.
5. **Fase 5: Frontend y UI Premium**
   - Inicializar Vite + React.
   - Replicar vistas (Login, Dashboard, Insumos) con diseño responsivo.
6. **Fase 6: Pruebas y Auditoría**
   - Pruebas unitarias de las fórmulas matemáticas.

---

## 3. Fórmulas y Reglas de Negocio para Movimientos

Para garantizar precisión milimétrica en el inventario, el agente debe aplicar las siguientes reglas:

### A. Ecuación Fundamental de Inventario
```text
Stock_Actual = (Σ Entradas) - (Σ Salidas) + (Σ Ajustes Positivos) - (Σ Ajustes Negativos)
```
*El sistema nunca debe actualizar el stock "a ciegas" modificando el campo `stock` directamente con un UPDATE. Se deben registrar los movimientos e inferir el stock o actualizarlo mediante transacciones atómicas seguras (ej. `@Transactional` en Spring).*

### B. Validaciones Críticas Previas a Modificación
1. **Validación de Salida (Egreso):**
   - **Regla:** `Cantidad Solicitada <= Stock_Actual`
   - Si la cantidad es mayor, lanzar excepción de negocio (`InsufficientStockException`) con HTTP 422 o 400. NUNCA permitir saldo negativo.
2. **Entradas (Ingresos):**
   - Solo pueden ser enteros positivos `> 0`.
3. **Ajustes Justificados (Manuales y Correcciones):**
   - **Regla Estricta:** TODO ajuste (`AJUSTE_MANUAL`, `CORRECCION_ENTRADA`, etc.) **DEBE** requerir un campo `motivo_ajuste` o `justificacion` (String mínimo de 20 caracteres) y quedar registrado con el `usuario_id` responsable.

---

## 4. Nueva Estructura para Manejo de Errores y Validaciones (Estándares)

Para el desarrollo en Spring Boot, el agente debe seguir esta arquitectura robusta:

### Validaciones (Bean Validation)
Utilizar `jakarta.validation.constraints` a nivel de DTO:
```java
public class MovimientoDTO {
    @NotNull(message = "El ID del insumo es obligatorio")
    private Long insumoId;

    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @NotBlank(message = "Debe justificar este ajuste")
    @Size(min = 20, message = "La justificación debe tener al menos 20 caracteres")
    private String justificacion;
}
```

### Manejo Global de Errores (Controller Advice)
Crear una clase anotada con `@RestControllerAdvice` para capturar excepciones e interceptar errores de validación sin que el servidor se caiga o devuelva HTML.

**Respuestas estandarizadas (JSON):**
```json
{
  "timestamp": "2026-07-25T22:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Error de validación en los campos enviados",
  "details": {
    "cantidad": "La cantidad debe ser mayor a 0",
    "justificacion": "La justificación es obligatoria en ajustes manuales"
  }
}
```

### Transaccionalidad
Toda función en la capa Service que afecte inventario (entradas o salidas) **debe** llevar la anotación `@Transactional`. Esto asegura que si una validación falla a mitad de un proceso (o si la BD falla), **nada** se guarde y el stock no se corrompa.
