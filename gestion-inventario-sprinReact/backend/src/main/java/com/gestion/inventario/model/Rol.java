package com.gestion.inventario.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
public class Rol {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(nullable = false)
    private Integer nivel;

    private String descripcion;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rol_permisos",
        joinColumns = @JoinColumn(name = "rol_id"),
        inverseJoinColumns = @JoinColumn(name = "permiso_id")
    )
    private List<Permiso> permisos = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
