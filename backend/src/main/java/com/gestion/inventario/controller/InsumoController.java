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
}
