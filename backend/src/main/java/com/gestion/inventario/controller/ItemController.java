package com.gestion.inventario.controller;

import com.gestion.inventario.dto.ItemRequestDTO;
import com.gestion.inventario.dto.PresentationRequestDTO;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.service.AuditService;
import com.gestion.inventario.service.ItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    @Autowired
    private AuditService auditService;

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
    public Item crearItem(@Valid @RequestBody ItemRequestDTO request,
                          Authentication authentication, HttpServletRequest httpRequest) {
        Item item = itemService.crearItem(request);
        auditService.registrar(AuditService.INSUMO_CREADO,
                "Creó el insumo " + item.getCode() + " · " + item.getName(),
                "items", item.getId(), authentication.getName(), authentication.getName(),
                httpRequest.getRemoteAddr());
        return item;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Item actualizarItem(@PathVariable Long id, @RequestBody ItemRequestDTO request,
                               Authentication authentication, HttpServletRequest httpRequest) {
        Item item = itemService.actualizarItem(id, request);
        auditService.registrar(AuditService.INSUMO_ACTUALIZADO,
                "Actualizó el insumo " + item.getCode() + " · " + item.getName(),
                "items", item.getId(), authentication.getName(), authentication.getName(),
                httpRequest.getRemoteAddr());
        return item;
    }

    @PostMapping("/{id}/presentations")
    @PreAuthorize("hasRole('ADMIN')")
    public Presentation agregarPresentacion(@PathVariable Long id,
                                            @Valid @RequestBody PresentationRequestDTO request,
                                            Authentication authentication, HttpServletRequest httpRequest) {
        Presentation presentation = itemService.agregarPresentacion(id, request);
        auditService.registrar(AuditService.PRESENTACION_AGREGADA,
                "Agregó la presentación " + presentation.getName() + " al insumo " + id,
                "presentations", presentation.getId(), authentication.getName(),
                authentication.getName(), httpRequest.getRemoteAddr());
        return presentation;
    }
}
