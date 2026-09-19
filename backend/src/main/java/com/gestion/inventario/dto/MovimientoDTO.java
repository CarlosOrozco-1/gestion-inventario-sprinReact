package com.gestion.inventario.dto;

import com.gestion.inventario.model.MovimientoTipo;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovimientoDTO {
    @NotNull(message = "El ID de la presentación es obligatorio")
    private Long presentationId;

    // Enum estricto: valores libres o con espacios se rechazan con 400.
    @NotNull(message = "El tipo de movimiento es obligatorio")
    private MovimientoTipo type;

    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    @NotNull(message = "La cantidad es obligatoria")
    private Integer quantity;

    private String detail;
}