package com.gestion.inventario.controller;

import com.gestion.inventario.dto.InsumoViewDTO;
import com.gestion.inventario.dto.PresentationRequestDTO;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.service.AuditService;
import com.gestion.inventario.service.ItemService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/presentations")
public class PresentationController {

    @Autowired
    private ItemService itemService;

    @Autowired
    private AuditService auditService;

    @GetMapping("/qr/{qrCode}")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public ResponseEntity<InsumoViewDTO> getByQrCode(@PathVariable String qrCode) {
        Optional<Presentation> presentationOpt = itemService.findPresentationByQrCode(qrCode);
        if (presentationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Presentation p = presentationOpt.get();
        InsumoViewDTO dto = new InsumoViewDTO();
        dto.setId(p.getId());
        dto.setCode(p.getItem().getCode());
        dto.setItem(p.getItem().getName());
        dto.setPresentation(p.getName());
        dto.setSize(p.getSize());
        dto.setStock(p.getStock());
        dto.setMinStock(p.getMinStock());
        dto.setMaxStock(p.getMaxStock());
        dto.setEstimatedCost(p.getEstimatedCost());
        dto.setQrCode(p.getQrCode());
        dto.setActivo(p.getItem().getActivo());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Presentation actualizarPresentacion(@PathVariable Long id,
                                               @Valid @RequestBody PresentationRequestDTO request) {
        return itemService.actualizarPresentacion(id, request);
    }

    /**
     * Registra en la bitácora una acción de un usuario sobre el código QR de una
     * presentación (descargar PNG, imprimir cartel o consultar/escaneo).
     * El QR se genera del lado del cliente (qrcode.react), por lo que la propia
     * app informa al backend para dejar constancia de quién/cuándo/dónde.
     * Cuerpo: {"accion": "DESCARGA" | "IMPRESION" | "CONSULTA"}
     */
    @PostMapping("/{id}/qr-event")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public void registrarEventoQr(@PathVariable Long id,
                                  @RequestBody Map<String, String> body,
                                  Authentication authentication,
                                  HttpServletRequest httpRequest) {
        itemService.findPresentationById(id).ifPresent(p -> {
            String accion = body.getOrDefault("accion", "CONSULTA").toUpperCase();
            String eventType;
            String detalle;
            switch (accion) {
                case "DESCARGA" -> { eventType = AuditService.QR_DESCARGA; detalle = "Descargó el código QR de "; }
                case "IMPRESION" -> { eventType = AuditService.QR_IMPRESION; detalle = "Imprimió el código QR de "; }
                default -> { eventType = AuditService.QR_CONSULTADO; detalle = "Consultó el código QR de "; }
            }
            auditService.registrar(eventType,
                    detalle + p.getItem().getCode() + " · " + p.getItem().getName(),
                    "presentations", p.getId(),
                    authentication.getName(), authentication.getName(),
                    httpRequest.getRemoteAddr());
        });
    }
}