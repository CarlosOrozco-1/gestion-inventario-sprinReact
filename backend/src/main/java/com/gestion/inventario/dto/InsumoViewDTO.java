package com.gestion.inventario.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Vista aplanada de una presentación (Fase 16). El material es el item y la
 * presentación su variante. Los nombres de campo siguen el esquema en inglés
 * (Fase 17) para el contrato JSON de GET /api/insumos.
 */
@Data
public class InsumoViewDTO {
    private Long id;
    private Integer code;
    private String item;
    private String presentation;
    private String size;
    private Integer stock;
    private Integer minStock;
    private Integer maxStock;
    private BigDecimal estimatedCost;
}
