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

    /**
     * Busca otra presentación del mismo material con el mismo nombre y tamaño.
     * Existe el constraint uq_presentation_item_name_size en PostgreSQL; sin esta
     * comprobación previa, un nombre+tamaño repetido reventaba el UPDATE y el
     * cliente recibía un 500 sin explicación. Se usa para responder 400 con un
     * mensaje que el usuario entienda. `excludeId` permite que una actualización
     * no choque consigo misma.
     */
    @Query("select p from Presentation p where p.item.id = :itemId "
            + "and upper(trim(p.name)) = upper(trim(:name)) "
            + "and upper(trim(p.size)) = upper(trim(:size)) "
            + "and (:excludeId is null or p.id <> :excludeId)")
    Optional<Presentation> findDuplicada(@Param("itemId") Long itemId,
                                        @Param("name") String name,
                                        @Param("size") String size,
                                        @Param("excludeId") Long excludeId);

    // Bloqueo pesimista de fila: serializa entradas/salidas sobre la misma
    // presentación para evitar lost-update en el stock (AGENTS.md: transacciones
    // atómicas seguras). El lock se mantiene hasta el commit del @Transactional.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Presentation p where p.id = :id")
    Optional<Presentation> findByIdForUpdate(@Param("id") Long id);
}
