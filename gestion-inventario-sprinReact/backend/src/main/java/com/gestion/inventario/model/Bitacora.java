package com.gestion.inventario.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bitacora")
@Data
@NoArgsConstructor
public class Bitacora {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String accion;

    @Column(nullable = false)
    private String modulo;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String justificacion;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "usuario_nombre", nullable = false)
    private String usuarioNombre;

    @Column(name = "entidad_id")
    private Long entidadId;

    @Column(name = "entidad_tipo")
    private String entidadTipo;

    @Column(name = "datos_anteriores", columnDefinition = "TEXT")
    private String datosAnteriores;

    @Column(name = "datos_nuevos", columnDefinition = "TEXT")
    private String datosNuevos;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
