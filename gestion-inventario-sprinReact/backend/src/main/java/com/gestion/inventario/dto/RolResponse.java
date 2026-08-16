package com.gestion.inventario.dto;

import com.gestion.inventario.model.Rol;
import lombok.Data;

import java.util.List;

@Data
public class RolResponse {
    private Long id;
    private String nombre;
    private Integer nivel;
    private String descripcion;
    private List<String> permisos;

    public static RolResponse from(Rol r) {
        RolResponse resp = new RolResponse();
        resp.setId(r.getId());
        resp.setNombre(r.getNombre());
        resp.setNivel(r.getNivel());
        resp.setDescripcion(r.getDescripcion());
        resp.setPermisos(r.getPermisos() == null
                ? List.of()
                : r.getPermisos().stream().map(p -> p.getCodigo()).toList());
        return resp;
    }
}
