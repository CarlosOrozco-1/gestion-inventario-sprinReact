package com.gestion.inventario.controller;

import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Map<String, Object>> listarUsuarios() {
        return usuarioRepository.findAll().stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("nombre", u.getNombre());
            map.put("email", u.getEmail());
            map.put("rol", u.getRol() != null ? u.getRol().getNombre().toUpperCase() : "AUXILIAR");
            map.put("nivel", u.getRol() != null ? u.getRol().getNivel() : 10);
            map.put("activo", u.getActivo());
            return map;
        }).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuarioPorId(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody Map<String, String> body) {
        String nombre = body.get("nombre");
        String email = normalizarEmail(body.get("email"));
        String password = body.get("password");
        String rolNombre = body.getOrDefault("rol", "AUXILIAR").toLowerCase();

        if (usuarioRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El correo ya está registrado"));
        }

        Rol rol = rolRepository.findByNombre(rolNombre)
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombre(rolNombre);
                    newRol.setNivel(rolNombre.equals("admin") ? 100 : rolNombre.equals("jefe") ? 50 : 10);
                    return rolRepository.save(newRol);
                });

        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(password != null ? password : "123456"));
        usuario.setRol(rol);
        usuario.setActivo(true);

        Usuario guardado = usuarioRepository.save(usuario);
        return ResponseEntity.ok(guardado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return usuarioRepository.findById(id).map(usuario -> {
            if (body.containsKey("nombre")) usuario.setNombre(body.get("nombre"));
            if (body.containsKey("email")) usuario.setEmail(normalizarEmail(body.get("email")));
            if (body.containsKey("password") && !body.get("password").isBlank()) {
                usuario.setPasswordHash(passwordEncoder.encode(body.get("password")));
            }
            if (body.containsKey("rol")) {
                String rolNombre = body.get("rol").toLowerCase();
                Rol rol = rolRepository.findByNombre(rolNombre)
                        .orElseGet(() -> {
                            Rol newRol = new Rol();
                            newRol.setNombre(rolNombre);
                            newRol.setNivel(rolNombre.equals("admin") ? 100 : rolNombre.equals("jefe") ? 50 : 10);
                            return rolRepository.save(newRol);
                        });
                usuario.setRol(rol);
            }

            Usuario guardado = usuarioRepository.save(usuario);
            return ResponseEntity.ok(guardado);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String normalizarEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}
