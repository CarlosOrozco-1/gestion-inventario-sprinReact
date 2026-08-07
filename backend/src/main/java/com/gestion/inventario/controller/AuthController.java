package com.gestion.inventario.controller;

import com.gestion.inventario.dto.LoginRequest;
import com.gestion.inventario.dto.LoginResponse;
import com.gestion.inventario.dto.RecuperarRequest;
import com.gestion.inventario.dto.RestablecerRequest;
import com.gestion.inventario.dto.VerificarRequest;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import com.gestion.inventario.security.JwtUtil;
import com.gestion.inventario.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        
        // 1. Verificamos las credenciales contra la Base de Datos usando Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // 2. Si es exitoso, buscamos al usuario para obtener sus datos extra (id, rol)
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado post-autenticacion"));

        // 3. Generamos el Token JWT seguro
        String jwtToken = jwtUtil.generateToken(usuario.getEmail());

        // 4. Armamos la respuesta con el token y los datos de la sesión
        LoginResponse.UsuarioInfo info = new LoginResponse.UsuarioInfo(
                usuario.getId(),
                usuario.getName(),
                usuario.getEmail(),
                usuario.getRol().getName(),
                usuario.getRol().getLevel()
        );

        return ResponseEntity.ok(new LoginResponse(jwtToken, info));
    }

    @PostMapping("/recuperar")
    public ResponseEntity<Map<String, String>> recuperar(@Valid @RequestBody RecuperarRequest request) {
        // Respuesta genérica: no revela si el email está registrado.
        passwordResetService.solicitarRecuperacion(request.getEmail());
        return ResponseEntity.ok(Map.of(
                "mensaje",
                "Si el correo está registrado, recibirás un código para restablecer tu contraseña.")
        );
    }

    @PostMapping("/verificar-codigo")
    public ResponseEntity<Map<String, Object>> verificarCodigo(@Valid @RequestBody VerificarRequest request) {
        passwordResetService.verificarCodigo(request.getEmail(), request.getCodigo());
        return ResponseEntity.ok(Map.of(
                "valido", true,
                "mensaje", "Código válido. Ingresa tu nueva contraseña.")
        );
    }

    @PostMapping("/restablecer")
    public ResponseEntity<Map<String, String>> restablecer(@Valid @RequestBody RestablecerRequest request) {
        passwordResetService.restablecer(
                request.getEmail(),
                request.getCodigo(),
                request.getNuevaPassword()
        );
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente. Ya puedes iniciar sesión."));
    }
}
