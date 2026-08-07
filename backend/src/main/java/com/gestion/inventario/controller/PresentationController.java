package com.gestion.inventario.controller;

import com.gestion.inventario.dto.PresentationRequestDTO;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Fase 16 — Edición de presentaciones (variantes) existentes.
 */
@RestController
@RequestMapping("/api/presentations")
public class PresentationController {

    @Autowired
    private ItemService itemService;

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Presentation actualizarPresentacion(@PathVariable Long id,
                                               @Valid @RequestBody PresentationRequestDTO request) {
        return itemService.actualizarPresentacion(id, request);
    }
}
