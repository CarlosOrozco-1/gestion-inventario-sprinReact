package com.gestion.inventario.model;

/**
 * Tipos de movimiento del motor transaccional (Fase 4).
 * Centraliza el catálogo válido y las reglas asociadas a cada tipo para
 * impedir valores libres/arbitrarios en el contrato de la API.
 */
public enum MovimientoTipo {
    ENTRADA("Entrada", false),
    SALIDA("Salida", false),
    AJUSTE_POSITIVO("Ajuste positivo (sobrante)", true),
    AJUSTE_NEGATIVO("Ajuste negativo (merma)", true);

    private final String etiqueta;
    private final boolean ajuste;

    MovimientoTipo(String etiqueta, boolean ajuste) {
        this.etiqueta = etiqueta;
        this.ajuste = ajuste;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /** ¿Requiere justificación de al menos 20 caracteres? (regla de AGENTS.md) */
    public boolean esAjuste() {
        return ajuste;
    }
}