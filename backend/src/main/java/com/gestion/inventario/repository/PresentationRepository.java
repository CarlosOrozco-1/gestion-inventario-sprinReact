package com.gestion.inventario.repository;

import com.gestion.inventario.model.Presentation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PresentationRepository extends JpaRepository<Presentation, Long> {
    List<Presentation> findByItemId(Long itemId);
    Optional<Presentation> findByQrCode(String qrCode);

    // Bloqueo pesimista de fila: serializa entradas/salidas sobre la misma
    // presentación para evitar lost-update en el stock (AGENTS.md: transacciones
    // atómicas seguras). El lock se mantiene hasta el commit del @Transactional.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Presentation p where p.id = :id")
    Optional<Presentation> findByIdForUpdate(@Param("id") Long id);
}
