package com.gestion.inventario.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Alta/edición de una presentación (variante) de un material (Fase 16).
 */
@Data
public class PresentationRequestDTO {

    @NotBlank(message = "El nombre de la presentación es obligatorio")
    private String name;

    @NotBlank(message = "El tamaño de la presentación es obligatorio")
    private String size;

    @Min(value = 1, message = "El stock mínimo debe ser al menos 1")
    private Integer minStock = 5;

    @Min(value = 1, message = "El stock máximo debe ser al menos 1")
    private Integer maxStock = 50;

    private BigDecimal estimatedCost = BigDecimal.ZERO;
}
