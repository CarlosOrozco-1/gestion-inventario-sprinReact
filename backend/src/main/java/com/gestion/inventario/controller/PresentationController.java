package com.gestion.inventario.controller;

import com.gestion.inventario.dto.InsumoViewDTO;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.service.ItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/presentations")
public class PresentationController {

    @Autowired
    private ItemService itemService;

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
        return ResponseEntity.ok(dto);
    }
}