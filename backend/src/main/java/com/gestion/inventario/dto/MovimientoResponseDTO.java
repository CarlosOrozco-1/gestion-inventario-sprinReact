package com.gestion.inventario.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MovimientoResponseDTO {
    private Long id;
    private String insumoNombre;
    private String insumoPresentacion;
    private String tipo;
    private Integer cantidad;
    private String detalle;
    private String usuarioNombre;
    private LocalDateTime createdAt;
}
