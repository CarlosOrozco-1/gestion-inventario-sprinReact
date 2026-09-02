# Diagramas de Flujo del Sistema (Mermaid)

Este documento contiene los diagramas arquitectónicos y de flujo operativo del sistema.
Los flujos de cada módulo tienen un archivo propio; este documento los indexa:

## Índice de diagramas por módulo

| Módulo / Flujo | Archivo |
| -------------- | ------- |
| Autenticación — Login | [`flujo_login.md`](./flujo_login.md) |
| Autenticación — Recuperación de contraseña | [`flujo_recuperar_contrasena.md`](./flujo_recuperar_contrasena.md) |
| Movimientos (Kárdex y Transacciones) | sección 1 abajo |
| Ajustes (correcciones manuales de stock) | sección 2 abajo |
| Reportería (Excel) | sección 3 abajo |
| Auditoría del Sistema (bitácora de eventos) | [`flujo_auditoria.md`](./flujo_auditoria.md) |

---

## 1. Flujo de Módulo de Movimientos (Kárdex y Transacciones)
```mermaid
graph TD
    A[Usuario solicita Movimiento] --> B{¿Es Entrada o Salida?}
    B -->|Entrada| C[Sumar Cantidad al Stock]
    B -->|Salida| D{¿Stock >= Cantidad?}
    D -->|Sí| E[Restar Cantidad al Stock]
    D -->|No| F[Excepción: Stock Insuficiente - Abortar]
    
    C --> G[Registrar en Historial de Movimientos]
    E --> G
    
    G --> H[Finalizar Transacción Segura]
    F --> I[Mostrar Error en Interfaz]
```

## 2. Flujo de Módulo de Ajustes (correcciones manuales de stock)
```mermaid
graph TD
    A[Administrador inicia Ajuste] --> B[Seleccionar Insumo y Tipo de Ajuste]
    B --> C[Ingresar Justificación Obligatoria > 20 Caracteres]
    C --> D{¿Validación Exitosa?}
    D -->|Sí| E[Registrar Ajuste a nombre del Administrador]
    D -->|No| F[Rechazar Petición - Error 400]
    E --> G[Alterar Stock Matemáticamente]
```

## 3. Flujo de Reportería (Generación Excel)
```mermaid
graph LR
    A[Usuario interactúa con Filtros React] --> B[Filtrado Local Dinámico]
    B --> C[Usuario presiona Exportar Excel]
    C --> D[React extrae Array de IDs filtrados]
    D --> E[POST /api/reportes/excel con IDs]
    E --> F[Spring Boot: MovimientoRepository.findAllById]
    F --> G[Apache POI: Dibuja celdas y estilos]
    G --> H[Respuesta Blob Binario xlsx]
    H --> I[Navegador Fuerza Descarga del Archivo]
```

## 4. Flujo de Recuperación de Contraseña (Fase 12)
> ✅ Implementado y documentado a detalle en
> [`flujo_recuperar_contrasena.md`](./flujo_recuperar_contrasena.md).
> Vista resumida (secuencia):

```mermaid
sequenceDiagram
    participant Usuario
    participant React UI
    participant Spring Boot
    participant SMTP Server
    
    Usuario->>React UI: Clic en "Olvidé mi contraseña"
    React UI->>Spring Boot: POST /api/auth/recuperar (email)
    Spring Boot->>Spring Boot: Genera Token/PIN Temporal
    Spring Boot->>SMTP Server: Enviar Email al Usuario
    SMTP Server-->>Usuario: Recibe PIN
    Usuario->>React UI: Ingresa PIN y Nueva Clave
    React UI->>Spring Boot: POST /api/auth/verificar-codigo + /restablecer
    Spring Boot-->>React UI: Contraseña Actualizada
```
