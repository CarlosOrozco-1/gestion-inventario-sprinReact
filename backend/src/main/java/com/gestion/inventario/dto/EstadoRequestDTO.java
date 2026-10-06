package com.gestion.inventario.dto;

import lombok.Data;

/**
 * Cuerpo de los endpoints que cambian un estado lógico (inactivar/reactivar
 * un material o una presentación).
 *
 * <p>{@code motivo} está declarado como opcional a propósito: solo es
 * obligatorio al <b>inactivar</b> y esa regla la aplica
 * {@code ItemService.validarMotivoInactivacion} para no duplicarla en cada
 * controller. Al reactivar, el motivo es una nota opcional.
 */
@Data
public class EstadoRequestDTO {

    private Boolean activo;

    private String motivo;
}
