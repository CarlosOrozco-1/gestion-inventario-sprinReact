package com.gestion.inventario.controller;

import com.gestion.inventario.dto.LoginRequest;
import com.gestion.inventario.dto.LoginResponse;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import com.gestion.inventario.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

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
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol().getNombre(),
                usuario.getRol().getNivel()
        );

        return ResponseEntity.ok(new LoginResponse(jwtToken, info));
    }
}
