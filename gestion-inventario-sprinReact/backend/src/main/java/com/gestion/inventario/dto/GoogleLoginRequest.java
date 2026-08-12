package com.gestion.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLoginRequest {
    @NotBlank(message = "El token de Google es obligatorio")
    private String credential;
}
