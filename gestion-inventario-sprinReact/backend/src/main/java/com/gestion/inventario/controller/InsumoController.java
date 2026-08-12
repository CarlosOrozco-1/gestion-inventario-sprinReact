package com.gestion.inventario.controller;

import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.repository.InsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/{id}")
    public ResponseEntity<Insumo> obtenerInsumoPorId(@PathVariable Long id) {
        return insumoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Insumo> crearInsumo(@RequestBody Insumo insumo) {
        Insumo nuevo = insumoRepository.save(insumo);
        return ResponseEntity.ok(nuevo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Insumo> actualizarInsumo(@PathVariable Long id, @RequestBody Insumo datosActualizados) {
        return insumoRepository.findById(id)
                .map(insumo -> {
                    if (datosActualizados.getInsumo() != null) insumo.setInsumo(datosActualizados.getInsumo());
                    if (datosActualizados.getPresentacion() != null) insumo.setPresentacion(datosActualizados.getPresentacion());
                    if (datosActualizados.getTamanoPresentacion() != null) insumo.setTamanoPresentacion(datosActualizados.getTamanoPresentacion());
                    if (datosActualizados.getNumero() != null) insumo.setNumero(datosActualizados.getNumero());
                    Insumo guardado = insumoRepository.save(insumo);
                    return ResponseEntity.ok(guardado);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarInsumo(@PathVariable Long id) {
        if (!insumoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        insumoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
