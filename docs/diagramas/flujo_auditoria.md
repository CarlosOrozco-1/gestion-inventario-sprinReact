# Diagrama de Flujo — Módulo de Auditoría

**Módulo:** Auditoría del Sistema (bitácora de eventos)
**Endpoints:** `GET /api/auditoria`, `GET /api/auditoria/eventos`
**Acceso:** Solo **ADMIN** (backend: `@PreAuthorize("hasRole('ADMIN')")`)
**Fase:** 24 (Auditoría del Sistema)

> La escritura de eventos es **automática** e inmutable (append-only): los
> módulos de Login, Movimientos/Ajustes, Usuarios y Reportes notifican a
> `AuditService.registrar(...)` al ejecutar sus acciones. La UI solo consulta.

## 1. Escritura de eventos (automática, al ejecutar cada acción)

```mermaid
graph TD
    subgraph Acciones_que_generan_auditoria [Acciones del sistema]
        L[POST /api/auth/login] --> LA{¿Credenciales correctas?}
        LA -->|Sí| LE[AuditService: LOGIN - inicio de sesión exitoso]
        LA -->|No| LFE[AuditService: LOGIN_FALLIDO - intento fallido]
        M[POST /api/movimientos - Entrada/Salida/Ajuste] --> ME[AuditService: MOVIMIENTO_CREADO]
        U[API /api/usuarios - crear / actualizar / rol / estado] --> UE[AuditService: USUARIO_CREADO / ACTUALIZADO / ROL_CAMBIADO / ESTADO_CAMBIADO]
        R[POST /api/reportes - PDF / Excel / Proyecciones] --> RE[AuditService: EXPORTACION_PDF / EXPORTACION_EXCEL / EXPORTACION_PROYECCIONES_*]
    end

    LE --> LOG
    LFE --> LOG
    ME --> LOG
    UE --> LOG
    RE --> LOG

    subgraph LOG [Persistencia - tabla audit_logs]
        INS[INSERT evento: event_type, description, entity_name, entity_id, usuario_email, ip_address, created_at]
    end
    INS --> FIN([Registro inmutable: no se edita ni se borra])
```

## 2. Consulta (página /auditoria, solo ADMIN)

```mermaid
graph TD
    INICIO([ADMIN abre Auditoría]) --> A[Carga GET /api/auditoria/eventos → catálogo de eventos]
    A --> B[GET /api/auditoria?page=0&size=20 → primeros registros]
    B --> C[Tabla: Fecha · Evento · Usuario · Descripción · IP]

    C --> D[¿Aplica filtros?]
    D -->|Sí| E[Evento select / Usuario / Desde / Hasta]
    E --> F[Buscar → GET /api/auditoria con filtros + paginación]
    F --> C
    D -->|No| G[¿Cambia de página?]
    G -->|Anterior / Siguiente| H[GET /api/auditoria?page=N → re-render tabla]
    G -->|No| C
```

## 2b. Notificación en tiempo real (WebSocket `/ws/auditoria`)

```mermaid
graph TD
    subgraph ESCRITURA [Escritura en BD]
        R[AuditService.registrar] --> INS[INSERT en audit_logs]
        INS --> PUB[Publica AuditLogSavedEvent por ApplicationEventPublisher]
    end

    PUB --> WS[AuditWebSocketHandler - broadcast AuditEventMessage]
    WS --> CLI[Cliente conectado a ws://host/ws/auditoria]
    CLI --> F[Auditoria.tsx recibe aviso]
    F --> REC[Re-consulta GET /api/auditoria - tabla se refresca sola]
```

- El WebSocket es una **señal push** (id, tipo, descripción, fecha) que **no
  transporta datos sensibles**: el contenido se obtiene siempre por REST
  autenticado.
- El frontend se suscribe con `useAuditSocket` (reconexión cada 4s) y re-consulta
  la bitácora al recibir el aviso.
- `nginx.conf` proxifica `/ws/` con upgrade de conexión (HTTP/1.1, timeouts 3600s).

## 3. Reglas de la bitácora

1. Solo el **ADMIN** consulta (`/api/auditoria`); el resto de roles no lo ve ni
   en el menú (frontend `MODULE_ACCESS['/auditoria'] = [ADMIN]`).
2. Las filas **nunca se modifican ni se eliminan**: garantizan trazabilidad
   de quién hizo qué, cuándo y desde qué IP.
3. El `filtro por fechas` es inclusivo (Desde = 00:00 de ese día; Hasta =
   hasta el final de ese día).
4. El orden por defecto es **descendente por fecha** (lo más reciente primero).

**Archivos clave:** `backend/...#/AuditService.java`, `AuditController.java`,
`AuditLog.java`, migración `V7__auditoria.sql`, `frontend/src/pages/Auditoria.tsx`.