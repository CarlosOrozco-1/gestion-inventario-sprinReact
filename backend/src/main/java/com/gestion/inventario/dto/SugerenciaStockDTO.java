package com.gestion.inventario.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SugerenciaStockDTO {
    private Long id;
    private Integer code;
    private String item;
    private String presentation;
    private String size;
    private Integer stock;
    private BigDecimal estimatedCost;
    private BigDecimal dailyConsumption;
    private Integer currentMinStock;
    private Integer currentMaxStock;
    private Integer suggestedMinStock;
    private Integer suggestedMaxStock;
    private boolean noConsumption;
    private boolean differs;
}
