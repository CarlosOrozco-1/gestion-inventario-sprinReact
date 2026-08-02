package com.gestion.inventario.controller;

import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.repository.InsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insumos")
public class InsumoController {

    @Autowired
    private InsumoRepository insumoRepository;

    @GetMapping
    public List<Insumo> listarInsumos() {
        return insumoRepository.findAll();
    }

    @PostMapping
    public Insumo crearInsumo(@RequestBody Insumo insumo) {
        return insumoRepository.save(insumo);
    }

    @PutMapping("/{id}")
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
