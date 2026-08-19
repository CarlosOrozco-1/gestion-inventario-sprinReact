package com.gestion.inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(
    name = "inventario_insumos",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"insumo", "presentacion", "tamano_presentacion"})
    }
)
@Data
@NoArgsConstructor
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer numero;

    @Column(nullable = false)
    private String insumo;

    @Column(nullable = false)
    private String presentacion;

    @Column(name = "tamano_presentacion", nullable = false)
    private String tamanoPresentacion;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(nullable = false)
    private Integer entrada = 0;

    @Column(name = "codigo_qr", unique = true)
    private String codigoQr;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.codigoQr == null || this.codigoQr.trim().isEmpty()) {
            String suffix = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.codigoQr = "INS-QR-" + (this.numero != null ? this.numero : "0") + "-" + suffix;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.codigoQr == null || this.codigoQr.trim().isEmpty()) {
            String suffix = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.codigoQr = "INS-QR-" + (this.numero != null ? this.numero : "0") + "-" + suffix;
        }
    }
}
