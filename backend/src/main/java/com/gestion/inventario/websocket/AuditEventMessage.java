package com.gestion.inventario.websocket;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Payload que se difunde por el canal `/ws/auditoria` cuando se registra un
 * nuevo evento de auditoría. Es una señal de "hubo cambios": el frontend la
 * usa para re-consultar la bitácora vía el endpoint autenticado
 * `GET /api/auditoria` (los datos sensibles nunca viajan por el WebSocket).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditEventMessage {
    private Long id;
    private String eventType;
    private String description;
    private LocalDateTime createdAt;
}
