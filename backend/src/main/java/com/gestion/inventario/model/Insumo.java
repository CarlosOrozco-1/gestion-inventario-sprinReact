package com.gestion.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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

    @Column(name = "stock_minimo")
    private Integer stockMinimo = 5;

    @Column(name = "stock_maximo")
    private Integer stockMaximo = 50;

    @Column(name = "costo_estimado", precision = 10, scale = 2) //precion por unidad, se multiplica por el stock para obtener el costo total
    private java.math.BigDecimal costoEstimado = java.math.BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
