package com.gestion.inventario.dto;

import lombok.Data;

@Data
public class NuevoUsuarioDTO {
    private String nombre;
    private String email;
    private String password;
    private String rol;
}
