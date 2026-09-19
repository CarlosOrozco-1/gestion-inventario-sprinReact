package com.gestion.inventario.controller;

import com.gestion.inventario.dto.MovimientoDTO;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.service.MovimientoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movimientos")
public class MovimientoController {

    @Autowired
    private MovimientoService movimientoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public ResponseEntity<Movimiento> registrarMovimiento(@Valid @RequestBody MovimientoDTO request,
                                                          Authentication authentication,
                                                          HttpServletRequest httpRequest) {
        // El responsable se deriva del JWT autenticado (email), NUNCA del body.
        Movimiento mov = movimientoService.registrarMovimiento(
                request.getPresentationId(),
                request.getType(),
                request.getQuantity(),
                request.getDetail(),
                authentication.getName(),
                httpRequest.getRemoteAddr()
        );
        return ResponseEntity.ok(mov);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public ResponseEntity<java.util.List<com.gestion.inventario.dto.MovimientoResponseDTO>> listarMovimientos() {
        return ResponseEntity.ok(movimientoService.listarMovimientos());
    }
}
