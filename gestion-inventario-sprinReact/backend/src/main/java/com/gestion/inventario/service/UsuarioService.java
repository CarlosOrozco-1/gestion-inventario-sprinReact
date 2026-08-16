package com.gestion.inventario.service;

import com.gestion.inventario.dto.UsuarioRequest;
import com.gestion.inventario.dto.UsuarioResponse;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(UsuarioResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {
        Usuario u = usuarioRepository.findDetailedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        return UsuarioResponse.from(u);
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (req.getPassword() == null || req.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria al crear un usuario.");
        }
        if (req.getPassword().length() < 6) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres.");
        }
        if (usuarioRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese correo electrónico.");
        }
        Rol rol = rolRepository.findById(req.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        Usuario u = new Usuario();
        u.setNombre(req.getNombre().trim());
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        u.setRol(rol);
        u.setActivo(req.getActivo() == null || req.getActivo());
        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    @Transactional
    public UsuarioResponse actualizar(Long id, UsuarioRequest req, String currentEmail) {
        Usuario u = usuarioRepository.findDetailedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        String nuevoEmail = req.getEmail().trim().toLowerCase();
        if (!u.getEmail().equalsIgnoreCase(nuevoEmail) && usuarioRepository.existsByEmail(nuevoEmail)) {
            throw new IllegalArgumentException("Ya existe un usuario con ese correo electrónico.");
        }

        Rol nuevoRol = rolRepository.findById(req.getRolId())
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        boolean esAdmin = "ADMIN".equalsIgnoreCase(u.getRol().getNombre());
        boolean seraAdmin = "ADMIN".equalsIgnoreCase(nuevoRol.getNombre());
        if (esAdmin && !seraAdmin && esUltimoAdminActivo()) {
            throw new IllegalArgumentException("No se puede modificar el último administrador activo del sistema.");
        }

        u.setNombre(req.getNombre().trim());
        u.setEmail(nuevoEmail);
        u.setRol(nuevoRol);
        if (req.getActivo() != null) {
            u.setActivo(req.getActivo());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            if (req.getPassword().length() < 6) {
                throw new IllegalArgumentException("La contraseña debe tener al menos 6 caracteres.");
            }
            u.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    @Transactional
    public UsuarioResponse desactivar(Long id, String currentEmail) {
        Usuario u = usuarioRepository.findDetailedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        if (u.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new IllegalArgumentException("No puedes desactivar tu propia cuenta.");
        }
        if (Boolean.TRUE.equals(u.getActivo())
                && "ADMIN".equalsIgnoreCase(u.getRol().getNombre())
                && esUltimoAdminActivo()) {
            throw new IllegalArgumentException("No se puede desactivar el último administrador activo del sistema.");
        }
        u.setActivo(false);
        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    @Transactional
    public UsuarioResponse activar(Long id) {
        Usuario u = usuarioRepository.findDetailedById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        u.setActivo(true);
        return UsuarioResponse.from(usuarioRepository.save(u));
    }

    private boolean esUltimoAdminActivo() {
        long adminsActivos = usuarioRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(Usuario::getActivo)
                .filter(u -> "ADMIN".equalsIgnoreCase(u.getRol().getNombre()))
                .count();
        return adminsActivos <= 1;
    }
}
