package com.gestion.inventario.controller;

import com.gestion.inventario.dto.PermisoResponse;
import com.gestion.inventario.repository.PermisoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permisos")
public class PermisoController {

    private final PermisoRepository permisoRepository;

    public PermisoController(PermisoRepository permisoRepository) {
        this.permisoRepository = permisoRepository;
    }

    @GetMapping
    public List<PermisoResponse> listar() {
        return permisoRepository.findAll().stream()
                .map(PermisoResponse::from)
                .toList();
    }
}
