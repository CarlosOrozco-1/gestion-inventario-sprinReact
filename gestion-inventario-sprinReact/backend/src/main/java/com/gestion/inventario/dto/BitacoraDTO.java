package com.gestion.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BitacoraDTO {

    @NotBlank(message = "La acción es obligatoria")
    private String accion;

    @NotBlank(message = "El módulo es obligatorio")
    private String modulo;

    @NotBlank(message = "La descripción es obligatoria")
    private String descripcion;

    @NotBlank(message = "La justificación es obligatoria")
    @Size(min = 10, message = "La justificación debe tener al menos 10 caracteres")
    private String justificacion;

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "El nombre del usuario es obligatorio")
    private String usuarioNombre;

    private Long entidadId;
    private String entidadTipo;
    private String datosAnteriores;
    private String datosNuevos;
}
