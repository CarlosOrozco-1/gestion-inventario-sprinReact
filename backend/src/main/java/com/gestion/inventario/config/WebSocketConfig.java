package com.gestion.inventario.config;

import com.gestion.inventario.websocket.AuditWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Registra el canal WebSocket `/ws/auditoria` usado para avisar en tiempo real
 * a los clientes cuando ocurre un nuevo evento de auditoría.
 * El handshake se permite desde el navegador (sin credenciales en el WS);
 * el contenido sensible se obtiene siempre por REST autenticado.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final AuditWebSocketHandler auditWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(auditWebSocketHandler, "/ws/auditoria")
                .setAllowedOrigins("*");
    }
}
