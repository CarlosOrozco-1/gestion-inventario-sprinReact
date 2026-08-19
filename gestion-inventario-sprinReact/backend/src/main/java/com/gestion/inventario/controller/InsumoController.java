package com.gestion.inventario.controller;

import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.repository.InsumoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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

    @GetMapping("/qr/{codigoQr}")
    public ResponseEntity<Insumo> obtenerInsumoPorCodigoQr(@PathVariable String codigoQr) {
        if (codigoQr == null || codigoQr.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        String cleanQr = codigoQr.trim();
        
        // 1. Buscar por coincidencia exacta de código QR
        Optional<Insumo> insumoOpt = insumoRepository.findByCodigoQr(cleanQr);
        if (insumoOpt.isPresent()) {
            return ResponseEntity.ok(insumoOpt.get());
        }

        // 2. Si no se encontró exacto, buscar insumos que contengan el fragmento o por número/ID
        List<Insumo> all = insumoRepository.findAll();
        for (Insumo ins : all) {
            if (ins.getCodigoQr() != null && ins.getCodigoQr().equalsIgnoreCase(cleanQr)) {
                return ResponseEntity.ok(ins);
            }
        }

        // 3. Fallback: verificar si es solo el número o ID
        try {
            Long numericId = Long.parseLong(cleanQr.replaceAll("[^0-9]", ""));
            for (Insumo ins : all) {
                if (ins.getId().equals(numericId) || (ins.getNumero() != null && ins.getNumero().longValue() == numericId)) {
                    return ResponseEntity.ok(ins);
                }
            }
        } catch (Exception ignored) {}

        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<Insumo> crearInsumo(@RequestBody Insumo insumo) {
        if (insumo.getCodigoQr() == null || insumo.getCodigoQr().trim().isEmpty()) {
            String suffix = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            insumo.setCodigoQr("INS-QR-" + (insumo.getNumero() != null ? insumo.getNumero() : "0") + "-" + suffix);
        }
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
                    if (insumo.getCodigoQr() == null || insumo.getCodigoQr().trim().isEmpty()) {
                        String suffix = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                        insumo.setCodigoQr("INS-QR-" + (insumo.getNumero() != null ? insumo.getNumero() : "0") + "-" + suffix);
                    }
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
