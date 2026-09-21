package com.gestion.inventario.service;

import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerfilService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Cambia la contraseña del usuario autenticado (cambio iniciado por el propio usuario).
     * Primero valida que la contraseña actual coincida con la registrada (BCrypt);
     * si no coincide, lanza excepción de negocio (400) y NO modifica nada.
     */
    @Transactional
    public void cambiarPassword(String email, String passwordActual, String nuevaPassword) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(passwordActual, usuario.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no coincide con la registrada");
        }

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);
    }
}