package com.gestion.inventario.controller;

import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.gestion.inventario.repository.RolRepository rolRepository;

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

    @GetMapping("/admin")
    public List<Usuario> listarUsuariosCompletos() {
        return usuarioRepository.findAll();
    }

    @PostMapping("/admin")
    public Usuario crearUsuario(@RequestBody com.gestion.inventario.dto.NuevoUsuarioDTO dto) {
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("El correo ya está en uso");
        }

        com.gestion.inventario.model.Rol rol = rolRepository.findByNombre(dto.getRol().toUpperCase())
                .orElseThrow(() -> new RuntimeException("Rol no válido"));

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol(rol);
        usuario.setActivo(true);
        
        return usuarioRepository.save(usuario);
    }

    @PutMapping("/admin/{id}/status")
    public Usuario cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> status) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(status.get("activo"));
        return usuarioRepository.save(usuario);
    }
}
