package com.gestion.inventario.controller;

import com.gestion.inventario.dto.InsumoViewDTO;
import com.gestion.inventario.dto.SugerenciaStockDTO;
import com.gestion.inventario.service.ItemService;
import com.gestion.inventario.service.SugerenciaStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insumos")
public class InsumoController {

    @Autowired
    private ItemService itemService;

    @Autowired
    private SugerenciaStockService sugerenciaStockService;

    // Vista aplanada de presentaciones (contrato legado para el frontend).
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public List<InsumoViewDTO> listarInsumos() {
        return itemService.listarVistaInsumos();
    }

    // Fase 10: criterios avanzados de stock mínimo/máximo según consumo de movimientos
    @GetMapping("/sugerencias-stock")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE')")
    public List<SugerenciaStockDTO> sugerenciasStock() {
        return sugerenciaStockService.sugerirStock();
    }
}
