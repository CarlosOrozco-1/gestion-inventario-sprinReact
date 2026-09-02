package com.gestion.inventario.controller;

import com.gestion.inventario.dto.ActualizarUsuarioDTO;
import com.gestion.inventario.dto.NuevoUsuarioDTO;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import com.gestion.inventario.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
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

    @Autowired
    private AuditService auditService;

    @GetMapping
    public List<Map<String, Object>> listarUsuariosResumen() {
        return usuarioRepository.findAll().stream().map(u -> 
            Map.of(
                "id", (Object) u.getId(),
                "name", (Object) u.getName(),
                "rol", (Object) u.getRol().getName()
            )
        ).collect(Collectors.toList());
    }

    @GetMapping("/admin")
    public List<Usuario> listarUsuariosCompletos() {
        return usuarioRepository.findAll();
    }

    @PostMapping("/admin")
    public Usuario crearUsuario(@RequestBody NuevoUsuarioDTO dto, Authentication authentication,
                                HttpServletRequest httpRequest) {
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }

        Rol rol = rolRepository.findByName(dto.getRol().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Rol no válido"));

        Usuario usuario = new Usuario();
        usuario.setName(dto.getName());
        usuario.setEmail(dto.getEmail());
        usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        usuario.setRol(rol);
        usuario.setActive(true);
        
        usuario = usuarioRepository.save(usuario);

        auditService.registrar(AuditService.USUARIO_CREADO,
                "Creación del usuario " + usuario.getEmail() + " (rol " + rol.getName() + ")",
                "usuarios", usuario.getId(), authentication.getName(), authentication.getName(), httpRequest.getRemoteAddr());

        return usuario;
    }

    @PutMapping("/admin/{id}")
    @Transactional
    public Usuario actualizarUsuario(@PathVariable Long id, @RequestBody ActualizarUsuarioDTO dto,
                                     Authentication authentication, HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (dto.getName() == null || dto.getName().isBlank()) {
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

        usuario.setName(dto.getName().trim());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            if (dto.getPassword().length() < 6) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres");
            }
            usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        usuario = usuarioRepository.save(usuario);

        auditService.registrar(AuditService.USUARIO_ACTUALIZADO,
                "Datos del usuario " + usuario.getEmail() + " actualizados",
                "usuarios", usuario.getId(), authentication.getName(), authentication.getName(), httpRequest.getRemoteAddr());

        return usuario;
    }

    @PutMapping("/admin/{id}/rol")
    @Transactional
    public Usuario cambiarRol(@PathVariable Long id, @RequestBody Map<String, String> rolBody,
                              Authentication authentication, HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        String nuevoRol = rolBody.get("rol");
        if (nuevoRol == null || nuevoRol.isBlank()) {
            throw new IllegalArgumentException("El rol es obligatorio");
        }
        Rol rol = rolRepository.findByName(nuevoRol.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Rol no válido"));

        String emailActual = authentication.getName();
        if (usuario.getEmail().equals(emailActual) && !rol.getName().equalsIgnoreCase("ADMIN")) {
            throw new IllegalArgumentException("No puedes cambiar tu propio rol");
        }

        usuario.setRol(rol);
        usuario = usuarioRepository.save(usuario);

        auditService.registrar(AuditService.USUARIO_ROL_CAMBIADO,
                "Rol de " + usuario.getEmail() + " cambiado a " + rol.getName(),
                "usuarios", usuario.getId(), authentication.getName(), authentication.getName(), httpRequest.getRemoteAddr());

        return usuario;
    }

    @PutMapping("/admin/{id}/status")
    @Transactional
    public Usuario cambiarEstado(@PathVariable Long id, @RequestBody Map<String, Boolean> status,
                                 Authentication authentication, HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (Boolean.FALSE.equals(status.get("active")) && usuario.getEmail().equals(authentication.getName())) {
            throw new IllegalArgumentException("No puedes suspender tu propia cuenta");
        }

        usuario.setActive(status.get("active"));
        usuario = usuarioRepository.save(usuario);

        String accion = Boolean.TRUE.equals(status.get("active")) ? "activado" : "suspendido";
        auditService.registrar(AuditService.USUARIO_ESTADO_CAMBIADO,
                "Usuario " + usuario.getEmail() + " " + accion,
                "usuarios", usuario.getId(), authentication.getName(), authentication.getName(), httpRequest.getRemoteAddr());

        return usuario;
    }
}
