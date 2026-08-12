package com.gestion.inventario.controller;

import com.gestion.inventario.dto.GoogleLoginRequest;
import com.gestion.inventario.dto.LoginRequest;
import com.gestion.inventario.dto.LoginResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import com.gestion.inventario.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UsuarioRepository usuarioRepository;

    @Value("${google.client-id}")
    private String googleClientId;

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
                usuario.getRol().getNombre().toUpperCase(),
                usuario.getRol().getNivel()
        );

        return ResponseEntity.ok(new LoginResponse(jwtToken, info));
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(request.getCredential());
            if (idToken == null || !Boolean.TRUE.equals(idToken.getPayload().getEmailVerified())) {
                return ResponseEntity.status(401).build();
            }

            String email = idToken.getPayload().getEmail().trim().toLowerCase();
            Usuario usuario = usuarioRepository.findByEmail(email)
                    .filter(u -> Boolean.TRUE.equals(u.getActivo()))
                    .orElse(null);
            if (usuario == null) {
                return ResponseEntity.status(403).build();
            }

            String jwtToken = jwtUtil.generateToken(usuario.getEmail());
            LoginResponse.UsuarioInfo info = new LoginResponse.UsuarioInfo(
                    usuario.getId(), usuario.getNombre(), usuario.getEmail(),
                    usuario.getRol().getNombre().toUpperCase(), usuario.getRol().getNivel());
            return ResponseEntity.ok(new LoginResponse(jwtToken, info));
        } catch (Exception exception) {
            return ResponseEntity.status(401).build();
        }
    }
}
