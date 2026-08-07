package com.gestion.inventario.dto;

import lombok.Data;

@Data
public class ActualizarUsuarioDTO {
    private String nombre;
    private String email;
    private String password;
}
