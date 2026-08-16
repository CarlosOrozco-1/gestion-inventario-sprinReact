package com.gestion.inventario.dto;

import com.gestion.inventario.model.Permiso;
import lombok.Data;

@Data
public class PermisoResponse {
    private String codigo;
    private String descripcion;

    public static PermisoResponse from(Permiso p) {
        PermisoResponse r = new PermisoResponse();
        r.setCodigo(p.getCodigo());
        r.setDescripcion(p.getDescripcion());
        return r;
    }
}
