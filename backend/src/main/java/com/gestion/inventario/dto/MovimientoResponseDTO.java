package com.gestion.inventario.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MovimientoResponseDTO {
    private Long id;
    private Long presentationId;
    private Long itemId;
    private String itemName;
    private String presentationName;
    private String type;
    private Integer quantity;
    private String detail;
    private String usuarioName;
    private LocalDateTime createdAt;
    /** Saldo de la presentación después de este movimiento (solo cuando se filtra por producto). */
    private Integer balanceAfter;
}
