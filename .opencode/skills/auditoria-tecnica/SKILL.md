---
name: auditoria-tecnica
description: Usar cuando se pida validar que el código cumpla estándares técnicos, revisar la arquitectura, "revisión de código/técnica", "cumple con las convenciones", auditar como se estructuran endpoints, componentes o el stack usado (React/Spring Boot). Verifica conformidad con AGENTS.md y las buenas prácticas del stack.
---

# Auditoría Técnica (conformidad con el stack)

Aplica esta checklist cuando el usuario pida validar/auditar que el código
cumpla con los estándares de desarrollo de las tecnologías usadas en SIGES:
**React (Vite + Tailwind + Zustand)** en frontend y **Spring Boot (JPA,
Security, Flyway)** en backend.

## Frontend / React

- **Componentes:** functional components + hooks. Nada de clases.
- **Rutas/páginas:** vistas en `src/pages/`, componentes reutilizables en
  `src/components/`, archivos en PascalCase.
- **Estado:** global solo con Zustand (`src/store/`); local con `useState`;
  derivaciones con `useMemo`. No meter estado de UI repetido en el store.
- **HTTP:** SIEMPRE el cliente `src/api/axios.ts` (inyecta el JWT). Nada de
  `fetch` suelto ni llamadas al endpoint backend directo.
- **Endpoints:** rutas REST correctas vía el cliente (`/items`, `/insumos`,
  `/movimientos`, `/presentations/{id}`, `/insumos/sugerencias-stock`). El
  nombre de la ruta y el método HTTP deben coincidir con la intención
  (GET leer, POST crear, PUT editar, DELETE solo si aplica).
- **Tipado:** no abusar de `any` en código nuevo; tipar props de componentes.
- **Estilos:** Tailwind + clases del tema (`brand-*`). Aplicar siempre la
  skill `mejora-ux` (convenciones de UI/UX).
- **Numeros:** nunca `float/double` para dinero; usar enteros para cantidades.

## Backend / Spring Boot

- **Controllers:** capa delgada; validan y delegan al service. Nunca exponer
  entidades JPA directamente: usar **DTOs**.
- **Validaciones:** Bean Validation en DTOs (`@NotNull`, `@Min`, `@Size`, ...).
- **Errores:** centralizados en `@RestControllerAdvice`
  (`GlobalExceptionHandler`); respuestas JSON estandarizadas.
- **Servicios:** `@Transactional` en toda operación que afecte inventario;
  el stock se actualiza vía transacciones, NUNCA con UPDATE a ciegas.
- **Repositorios:** Spring Data JPA (`repository/`).
- **Precisión:** `BigDecimal` o `Integer` (nunca float/double).
- **Búsqueda:** claves de filtrado y endpoints de lectura deben tener índice
  cuando la tabla crece (ver migraciones Flyway).

## Al auditar
1. Leer AGENTS.md (reglas de negocio + estándares) antes de opinar.
2. Ubicar el archivo/endpoint/recurso a revisar y listar hallazgos por
   severidad: **Bloqueante** (viola regla de negocio/datos) · **Importante**
   (mal endpoint, falta validación, `any` abusivo) · **Menor** (estilo/UX).
3. NO cambiar código: solo reportar hallazgos y sugerir el fix. El cambio se
   hace aparte, con permiso del usuario.
4. Cerrar el reporte con la lista de archivos revisados y, si aplica, qué tests
   cubren el área (Vitest/JUnit).