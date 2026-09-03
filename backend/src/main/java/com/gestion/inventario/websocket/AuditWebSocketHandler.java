package com.gestion.inventario.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.gestion.inventario.model.AuditLog;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Canal `/ws/auditoria`: difunde a todos los clientes conectados una notificación
 * cuando se registra un evento nuevo. Funciona como señal push (no transporta
 * datos sensibles): el frontend re-consulta la bitácora por REST autenticado.
 */
@Component
public class AuditWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    /** Publica el evento a todas las sesiones conectadas. */
    public void broadcast(AuditLog log) {
        try {
            AuditEventMessage message = new AuditEventMessage(
                    log.getId(), log.getEventType(), log.getDescription(), log.getCreatedAt());
            TextMessage text = new TextMessage(objectMapper.writeValueAsString(message));
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(text);
                }
            }
        } catch (Exception e) {
            // Un fallo al notificar por WS no debe romper el registro de auditoría.
        }
    }

    /**
     * Escucha el evento de aplicación publicado por {@code AuditService} tras
     * persistir cada evento y lo difunde en tiempo real.
     */
    @EventListener
    public void onAuditLogSaved(AuditLogSavedEvent event) {
        broadcast(event.getAuditLog());
    }
}
