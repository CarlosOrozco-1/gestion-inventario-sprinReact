package com.gestion.inventario.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Un rechazo por permisos (@PreAuthorize o el bloqueo de ajustes en
 * MovimientoService) tiene que viajar como 403 CON mensaje. Sin este handler,
 * Spring responde con su JSON por defecto, que no trae campo `message`, y en el
 * frontend todos los errores caían al mismo texto genérico que hacía pensar al
 * usuario que había escrito mal los datos en vez de que le faltan permisos.
 */
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void accessDeniedDevuelve403ConMensaje() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleAccessDenied(new AccessDeniedException("Registrar ajustes es una accion exclusiva de ADMIN y JEFE."));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals(403, response.getBody().get("status"));
        assertEquals("Registrar ajustes es una accion exclusiva de ADMIN y JEFE.", response.getBody().get("message"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    void accessDeniedSinMensajeUsaTextoPorDefecto() {
        ResponseEntity<Map<String, Object>> response =
                handler.handleAccessDenied(new AccessDeniedException(""));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        // Nunca un `message` vacío o nulo: el frontend lo muestra tal cual.
        assertEquals("No tienes permisos para realizar esta acción.", response.getBody().get("message"));
    }

    @Test
    void stockInsuficienteSigueDevolviendo422() {
        // Regresión: el 422 de stock insuficiente es regla de AGENTS.md y no debe
        // cambiarse por el nuevo handler de 403.
        ResponseEntity<Map<String, Object>> response =
                handler.handleInsufficientStock(new InsufficientStockException("Stock insuficiente."));

        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, response.getStatusCode());
        assertEquals("Stock insuficiente.", response.getBody().get("message"));
    }
}