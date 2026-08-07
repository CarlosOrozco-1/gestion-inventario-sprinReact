package com.gestion.inventario.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovimientoDTO {
    @NotNull(message = "El ID de la presentación es obligatorio")
    private Long presentationId;

    @NotNull(message = "El tipo de movimiento es obligatorio")
    private String type;

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    @NotNull(message = "La cantidad es obligatoria")
    private Integer quantity;

    private String detail;
}
