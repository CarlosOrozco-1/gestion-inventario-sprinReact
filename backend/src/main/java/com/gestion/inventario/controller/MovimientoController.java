package com.gestion.inventario.controller;

import com.gestion.inventario.dto.MovimientoDTO;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.service.MovimientoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {

    @Autowired
    private MovimientoService movimientoService;

    @PostMapping
    public ResponseEntity<Movimiento> registrarMovimiento(@Valid @RequestBody MovimientoDTO request) {
        Movimiento mov = movimientoService.registrarMovimiento(
                request.getInsumoId(),
                request.getTipo(),
                request.getCantidad(),
                request.getDetalle(),
                request.getUsuarioId()
        );
        return ResponseEntity.ok(mov);
    }

    @GetMapping
    public ResponseEntity<java.util.List<com.gestion.inventario.dto.MovimientoResponseDTO>> listarMovimientos() {
        return ResponseEntity.ok(movimientoService.listarMovimientos());
    }
}
