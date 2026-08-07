package com.gestion.inventario.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Vista aplanada de una presentación (Fase 16). Mantiene el contrato JSON
 * legado de GET /api/insumos (numero/insumo/presentacion/tamanoPresentacion)
 * para no romper el frontend: el material es el item y la presentación su variante.
 */
@Data
public class InsumoViewDTO {
    private Long id;
    private Integer numero;
    private String insumo;
    private String presentacion;
    private String tamanoPresentacion;
    private Integer stock;
    private Integer stockMinimo;
    private Integer stockMaximo;
    private BigDecimal costoEstimado;
}
