package com.gestion.inventario.controller;

import com.gestion.inventario.dto.ItemRequestDTO;
import com.gestion.inventario.dto.PresentationRequestDTO;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.service.ItemService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Fase 16 — Catálogo de materiales (items) y sus presentaciones (variantes).
 */
@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemService itemService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public List<Item> listarItems() {
        return itemService.listarItems();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public Item obtenerItem(@PathVariable Long id) {
        return itemService.listarItems().stream()
                .filter(i -> i.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Material no encontrado"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Item crearItem(@Valid @RequestBody ItemRequestDTO request) {
        return itemService.crearItem(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Item actualizarItem(@PathVariable Long id, @RequestBody ItemRequestDTO request) {
        return itemService.actualizarItem(id, request);
    }

    @PostMapping("/{id}/presentations")
    @PreAuthorize("hasRole('ADMIN')")
    public Presentation agregarPresentacion(@PathVariable Long id,
                                            @Valid @RequestBody PresentationRequestDTO request) {
        return itemService.agregarPresentacion(id, request);
    }
}
