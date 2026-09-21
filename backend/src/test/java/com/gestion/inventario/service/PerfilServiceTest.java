package com.gestion.inventario.service;

import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PerfilServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    private PerfilService service() {
        return new PerfilService(usuarioRepository, encoder);
    }

    @Test
    void debeActualizarLaContraseñaCuandoLaActualCoincide() {
        Usuario usuario = new Usuario();
        usuario.setEmail("admin@inventario.com");
        usuario.setPasswordHash(encoder.encode("claveActual123"));

        when(usuarioRepository.findByEmail("admin@inventario.com")).thenReturn(Optional.of(usuario));

        service().cambiarPassword("admin@inventario.com", "claveActual123", "nuevaClave456");

        assertTrue(encoder.matches("nuevaClave456", usuario.getPasswordHash()));
        verify(usuarioRepository).save(usuario);
    }

    @Test
    void debeRechazarCuandoLaContraseñaActualNoCoincide() {
        Usuario usuario = new Usuario();
        usuario.setEmail("admin@inventario.com");
        usuario.setPasswordHash(encoder.encode("claveActual123"));

        when(usuarioRepository.findByEmail("admin@inventario.com")).thenReturn(Optional.of(usuario));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> service().cambiarPassword("admin@inventario.com", "otraClave", "nuevaClave456"));

        assertTrue(ex.getMessage().contains("no coincide"));
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void debeFallarSiElUsuarioNoExiste() {
        when(usuarioRepository.findByEmail("inexistente@inventario.com")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service().cambiarPassword("inexistente@inventario.com", "cualquiera", "nuevaClave456"));
    }
}