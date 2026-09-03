package com.gestion.inventario.websocket;

import com.gestion.inventario.model.AuditLog;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Evento de aplicación publicado cada vez que {@code AuditService} persiste un
 * nuevo registro de auditoría. El {@code AuditWebSocketHandler} lo escucha para
 * notificar en tiempo real a los clientes conectados.
 */
@Getter
public class AuditLogSavedEvent extends ApplicationEvent {

    private final AuditLog auditLog;

    public AuditLogSavedEvent(Object source, AuditLog auditLog) {
        super(source);
        this.auditLog = auditLog;
    }
}
