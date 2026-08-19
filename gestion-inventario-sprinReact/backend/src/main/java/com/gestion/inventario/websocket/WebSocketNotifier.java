package com.gestion.inventario.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class WebSocketNotifier {

    private final InventarioWebSocketHandler handler;
    private final ObjectMapper objectMapper;

    public WebSocketNotifier(InventarioWebSocketHandler handler, ObjectMapper objectMapper) {
        this.handler = handler;
        this.objectMapper = objectMapper;
    }

    public void notificar(String tipo) {
        try {
            String payload = objectMapper.writeValueAsString(Map.of("type", tipo));
            handler.broadcast(payload);
        } catch (Exception ignored) {
        }
    }
}
