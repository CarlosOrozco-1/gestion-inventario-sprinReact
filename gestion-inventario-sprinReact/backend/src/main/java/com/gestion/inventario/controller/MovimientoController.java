package com.gestion.inventario.controller;

import com.gestion.inventario.dto.MovimientoDTO;
import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.service.MovimientoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {

    @Autowired
    private MovimientoService movimientoService;

    @PostMapping
    public ResponseEntity<?> registrarMovimiento(@Valid @RequestBody MovimientoDTO request) {
        try {
            Movimiento mov = movimientoService.registrarMovimiento(
                    request.getInsumoId(),
                    request.getTipo(),
                    request.getCantidad(),
                    request.getDetalle(),
                    request.getUsuarioId()
            );
            return ResponseEntity.ok(mov);
        } catch (IllegalArgumentException | InsufficientStockException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error interno al registrar movimiento: " + e.getMessage()));
        }
    }
}
