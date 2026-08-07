package com.gestion.inventario.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SugerenciaStockDTO {
    private Long id;
    private Integer numero;
    private String insumo;
    private String presentacion;
    private String tamanoPresentacion;
    private Integer stock;
    private BigDecimal costoEstimado;
    private BigDecimal consumoDiario;
    private Integer stockMinimoActual;
    private Integer stockMaximoActual;
    private Integer stockMinimoSugerido;
    private Integer stockMaximoSugerido;
    private boolean sinConsumo;
    private boolean difiere;
}
