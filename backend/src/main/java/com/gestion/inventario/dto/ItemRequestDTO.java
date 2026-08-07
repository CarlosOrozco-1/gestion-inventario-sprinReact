package com.gestion.inventario.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Creación de un material con al menos una presentación (Fase 16).
 */
@Data
public class ItemRequestDTO {

    @NotNull(message = "El código interno es obligatorio")
    private Integer code;

    @NotBlank(message = "El nombre del material es obligatorio")
    private String name;

    @NotNull(message = "Debe indicar al menos una presentación")
    @Size(min = 1, message = "Debe indicar al menos una presentación")
    @Valid
    private List<PresentationRequestDTO> presentations = new ArrayList<>();
}
