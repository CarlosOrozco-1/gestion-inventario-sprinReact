package com.gestion.inventario.controller;

import com.gestion.inventario.dto.CambiarPasswordRequest;
import com.gestion.inventario.service.AuditService;
import com.gestion.inventario.service.PerfilService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final PerfilService perfilService;
    private final AuditService auditService;

    @PutMapping("/cambiar-password")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            @Valid @RequestBody CambiarPasswordRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {

        String email = authentication.getName();
        perfilService.cambiarPassword(email, request.getPasswordActual(), request.getNuevaPassword());

        auditService.registrar(AuditService.PASSWORD_CAMBIADO,
                "Cambio de contraseña del propio usuario",
                "usuarios", null, email, email, httpRequest.getRemoteAddr());

        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada. Se cerrará tu sesión."));
    }
}