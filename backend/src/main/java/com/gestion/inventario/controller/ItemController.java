package com.gestion.inventario.controller;

import com.gestion.inventario.dto.EstadoRequestDTO;
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
    @PreAuthorize("hasAnyRole('ADMIN','JEFE')")
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
    @PreAuthorize("hasAnyRole('ADMIN','JEFE')")
    public Item actualizarItem(@PathVariable Long id, @RequestBody ItemRequestDTO request,
                               Authentication authentication, HttpServletRequest httpRequest) {
        Item item = itemService.actualizarItem(id, request);
        auditService.registrar(AuditService.INSUMO_ACTUALIZADO,
                "Actualizó el insumo " + item.getCode() + " · " + item.getName(),
                "items", item.getId(), authentication.getName(), authentication.getName(),
                httpRequest.getRemoteAddr());
        return item;
    }

    /**
     * Inactivar / reactivar un material (eliminación lógica). Acción exclusiva
     * de JEFE y ADMIN. Un material inactivo no permite nuevos movimientos.
     *
     * Cuerpo: {"activo": false, "motivo": "..."}. El motivo es obligatorio al
     * inactivar (lo valida ItemService) y queda escrito en la bitácora junto
     * con el stock que queda retenido, para que la decisión sea trazable.
     */
    @PutMapping("/{id}/estado")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE')")
    public Item cambiarEstado(@PathVariable Long id, @RequestBody EstadoRequestDTO body,
                              Authentication authentication, HttpServletRequest httpRequest) {
        boolean activo = Boolean.TRUE.equals(body.getActivo());
        String motivo = ItemService.validarMotivoInactivacion(activo, body.getMotivo());
        Item item = itemService.cambiarActivoItem(id, activo, motivo);

        StringBuilder detalle = new StringBuilder()
                .append(activo ? "Reactivó el insumo " : "Inactivó el insumo ")
                .append(item.getCode()).append(" · ").append(item.getName());
        if (!activo) {
            int unidades = item.getPresentations().stream()
                    .mapToInt(p -> p.getStock() == null ? 0 : p.getStock()).sum();
            detalle.append(" · ").append(unidades).append(" uds retenidas");
        }
        if (motivo != null) {
            detalle.append(" · Motivo: ").append(motivo);
        }

        auditService.registrar(activo ? AuditService.INSUMO_REACTIVADO : AuditService.INSUMO_INACTIVADO,
                detalle.toString(),
                "items", item.getId(), authentication.getName(), authentication.getName(),
                httpRequest.getRemoteAddr());
        return item;
    }

    @PostMapping("/{id}/presentations")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE')")
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
