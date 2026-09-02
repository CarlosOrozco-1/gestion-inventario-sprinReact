package com.gestion.inventario.controller;

import com.gestion.inventario.model.AuditLog;
import com.gestion.inventario.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * Módulo de Auditoría: consulta de la bitácora de eventos del sistema.
 * Solo ADMIN puede consultarlo (la escritura de eventos es automática).
 */
@RestController
@RequestMapping("/api/auditoria")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    /** Bitácora paginada con filtros opcionales por evento, usuario y rango de fechas. */
    @GetMapping
    public Page<AuditLog> listar(
            @RequestParam(required = false) String evento,
            @RequestParam(required = false) String usuario,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return auditService.listar(evento, usuario, desde, hasta, page, size);
    }

    /** Catálogo de eventos (código -> etiqueta) para filtros del frontend. */
    @GetMapping("/eventos")
    public Map<String, String> eventos() {
        return auditService.catalogoEventos();
    }
}