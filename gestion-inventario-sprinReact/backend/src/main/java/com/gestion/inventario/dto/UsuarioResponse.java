package com.gestion.inventario.dto;

import com.gestion.inventario.model.Usuario;
import lombok.Data;

@Data
public class UsuarioResponse {
    private Long id;
    private String nombre;
    private String email;
    private String rol;
    private Long rolId;
    private Integer nivel;
    private Boolean activo;
    private String createdAt;

    public static UsuarioResponse from(Usuario u) {
        UsuarioResponse r = new UsuarioResponse();
        r.setId(u.getId());
        r.setNombre(u.getNombre());
        r.setEmail(u.getEmail());
        r.setRol(u.getRol() != null ? u.getRol().getNombre() : null);
        r.setRolId(u.getRol() != null ? u.getRol().getId() : null);
        r.setNivel(u.getRol() != null ? u.getRol().getNivel() : null);
        r.setActivo(u.getActivo());
        r.setCreatedAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        return r;
    }
}
