package com.gestion.inventario.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MovimientoResponseDTO {
    private Long id;
    private String itemName;
    private String presentationName;
    private String type;
    private Integer quantity;
    private String detail;
    private String usuarioName;
    private LocalDateTime createdAt;
}
