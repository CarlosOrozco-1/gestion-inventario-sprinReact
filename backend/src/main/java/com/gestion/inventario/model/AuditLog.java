package com.gestion.inventario.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Registro inmutable de auditoría. Se escribe una fila por cada evento
 * relevante (LOGIN, MOVIMIENTO_CREADO, EXPORTACION_PDF...) y nunca se
 * modifica ni elimina: es el historial de trazabilidad del sistema.
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "entity_name", length = 100)
    private String entityName;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "usuario_email", length = 255)
    private String usuarioEmail;

    @Column(name = "usuario_name", length = 255)
    private String usuarioName;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}