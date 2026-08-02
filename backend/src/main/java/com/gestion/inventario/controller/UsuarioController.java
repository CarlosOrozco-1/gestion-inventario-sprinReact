package com.gestion.inventario.controller;

import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping
    public List<Map<String, Object>> listarUsuariosResumen() {
        return usuarioRepository.findAll().stream().map(u -> 
            Map.of(
                "id", (Object) u.getId(),
                "nombre", (Object) u.getNombre(),
                "rol", (Object) u.getRol().getNombre()
            )
        ).collect(Collectors.toList());
    }
}
