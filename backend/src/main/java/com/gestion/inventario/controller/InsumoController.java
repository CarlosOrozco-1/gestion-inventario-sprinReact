package com.gestion.inventario.controller;

import com.gestion.inventario.dto.SugerenciaStockDTO;
import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.repository.InsumoRepository;
import com.gestion.inventario.service.SugerenciaStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insumos")
public class InsumoController {

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private SugerenciaStockService sugerenciaStockService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','JEFE','AUXILIAR')")
    public List<Insumo> listarInsumos() {
        return insumoRepository.findAll();
    }

    // Fase 10: criterios avanzados de stock mínimo/máximo según consumo de movimientos
    @GetMapping("/sugerencias-stock")
    @PreAuthorize("hasAnyRole('ADMIN','JEFE')")
    public List<SugerenciaStockDTO> sugerenciasStock() {
        return sugerenciaStockService.sugerirStock();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Insumo crearInsumo(@RequestBody Insumo insumo) {
        return insumoRepository.save(insumo);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Insumo actualizarInsumo(@PathVariable Long id, @RequestBody Insumo insumoActualizado) {
        return insumoRepository.findById(id)
                .map(insumo -> {
                    insumo.setNumero(insumoActualizado.getNumero());
                    insumo.setInsumo(insumoActualizado.getInsumo());
                    insumo.setPresentacion(insumoActualizado.getPresentacion());
                    insumo.setTamanoPresentacion(insumoActualizado.getTamanoPresentacion());
                    
                    // Nuevos campos de configuración de stock (Fase 8)
                    if (insumoActualizado.getStockMinimo() != null) insumo.setStockMinimo(insumoActualizado.getStockMinimo());
                    if (insumoActualizado.getStockMaximo() != null) insumo.setStockMaximo(insumoActualizado.getStockMaximo());
                    if (insumoActualizado.getCostoEstimado() != null) insumo.setCostoEstimado(insumoActualizado.getCostoEstimado());

                    // No actualizamos stock ni entradas aquí, eso lo hace el motor de movimientos
                    return insumoRepository.save(insumo);
                })
                .orElseThrow(() -> new RuntimeException("Insumo no encontrado"));
    }
}
