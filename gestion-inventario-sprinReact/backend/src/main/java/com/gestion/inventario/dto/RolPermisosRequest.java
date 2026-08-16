package com.gestion.inventario.dto;

import lombok.Data;

import java.util.List;

@Data
public class RolPermisosRequest {
    private List<String> permisos;
}
