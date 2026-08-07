package com.gestion.inventario.repository;

import com.gestion.inventario.model.Movimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    List<Movimiento> findByPresentationId(Long presentationId);
    List<Movimiento> findAllByOrderByCreatedAtDesc();

    // Consumo de una presentación: salidas + ajustes negativos dentro de un período (Fase 10)
    @Query("SELECT m FROM Movimiento m WHERE m.presentation.id = :presentationId AND m.tipo IN ('SALIDA', 'AJUSTE_NEGATIVO') AND m.createdAt >= :desde")
    List<Movimiento> findConsumosDesde(@Param("presentationId") Long presentationId, @Param("desde") LocalDateTime desde);
}
