package com.gestion.inventario.controller;

import com.gestion.inventario.dto.ActualizarUsuarioDTO;
import com.gestion.inventario.dto.NuevoUsuarioDTO;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RolRepository rolRepository;

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
    public Usuario crearUsuario(@RequestBody NuevoUsuarioDTO dto) {
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }

        Rol rol = rolRepository.findByNombre(dto.getRol().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Rol no válido"));

        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol(rol);
        usuario.setActivo(true);
        
        return usuarioRepository.save(usuario);
    }

    @PutMapping("/admin/{id}")
    @Transactional
    public Usuario actualizarUsuario(@PathVariable Long id, @RequestBody ActualizarUsuarioDTO dto) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("El correo es obligatorio");
        }

        String nuevoEmail = dto.getEmail().trim().toLowerCase();
        if (!nuevoEmail.equals(usuario.getEmail())) {
            if (usuarioRepository.findByEmail(nuevoEmail).isPresent()) {
                throw new IllegalArgumentException("El correo ya está en uso");
            }
            usuario.setEmail(nuevoEmail);
        }

        usuario.setNombre(dto.getNombre().trim());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getPassword().length() < 6) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");
            }
            usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        return usuarioRepository.save(usuario);
    }

    @PutMapping("/admin/{id}/rol")
    @Transactional
    public Usuario cambiarRol(@PathVariable Long id, @RequestBody Map<String, String> rolBody,
                              Authentication authentication) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String nuevoRol = rolBody.get("rol");
        if (nuevoRol == null || nuevoRol.isBlank()) {
            throw new IllegalArgumentException("El rol es obligatorio");
        }
        Rol rol = rolRepository.findByNombre(nuevoRol.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Rol no válido"));

        String emailActual = authentication.getName();
        if (usuario.getEmail().equals(emailActual) && !rol.getNombre().equalsIgnoreCase("ADMIN")) {
            throw new IllegalArgumentException("No puedes cambiar tu propio rol");
        }

        usuario.setRol(rol);
        return usuarioRepository.save(usuario);
    }

    @PutMapping("/admin/{id}/status")
    @Transactional
    public Usuario cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> status,
                                 Authentication authentication) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (Boolean.FALSE.equals(status.get("activo")) && usuario.getEmail().equals(authentication.getName())) {
            throw new IllegalArgumentException("No puedes suspender tu propia cuenta");
        }

        usuario.setActivo(status.get("activo"));
        return usuarioRepository.save(usuario);
    }
}
