package com.gestion.inventario.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "inventario_insumos",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"name", "presentation", "size"})
    }
)
@Data
@NoArgsConstructor
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String presentation;

    @Column(name = "size", nullable = false)
    private String size;

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(nullable = false)
    private Integer entries = 0;

    @Column(name = "min_stock")
    private Integer minStock = 5;

    @Column(name = "max_stock")
    private Integer maxStock = 50;

    @Column(name = "estimated_cost", precision = 10, scale = 2) //precion por unidad, se multiplica por el stock para obtener el costo total
    private java.math.BigDecimal estimatedCost = java.math.BigDecimal.ZERO;

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
