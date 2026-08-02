package com.gestion.inventario.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProyeccionDTO {
    private String insumo;
    private Integer stock;
    private Integer stockMaximo;
    private Integer deficit;
    private BigDecimal costoEstimado;
    private BigDecimal inversionNecesaria;
    private String urgencia;
}
