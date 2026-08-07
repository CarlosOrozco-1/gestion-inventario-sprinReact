package com.gestion.inventario.dto;

import lombok.Data;

@Data
public class ActualizarUsuarioDTO {
    private String name;
    private String email;
    private String password;
}
