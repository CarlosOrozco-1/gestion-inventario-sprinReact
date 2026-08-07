package com.gestion.inventario.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProyeccionDTO {
    private String item;
    private Integer stock;
    private Integer maxStock;
    private Integer deficit;
    private BigDecimal estimatedCost;
    private BigDecimal requiredInvestment;
    private String urgency;
}
