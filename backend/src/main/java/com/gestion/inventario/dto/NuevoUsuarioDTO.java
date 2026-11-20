package com.gestion.inventario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class NuevoUsuarioDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String name;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "El correo no tiene un formato válido")
    private String email;

    // Sin esto, un alta sin contraseña o sin rol llegaba al service con null y
    // terminaba en un 500. Ahora responde 400 con el detalle por campo.
    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial")
    private String password;

    @NotBlank(message = "El rol es obligatorio (ADMIN, JEFE o AUXILIAR)")
    private String rol;
}