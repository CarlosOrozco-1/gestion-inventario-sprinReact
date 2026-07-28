package com.gestion.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private UsuarioInfo user;

    @Data
    @AllArgsConstructor
    public static class UsuarioInfo {
        private Integer id;
        private String nombre;
        private String email;
        private String rol;
        private Integer nivel;
    }
}
