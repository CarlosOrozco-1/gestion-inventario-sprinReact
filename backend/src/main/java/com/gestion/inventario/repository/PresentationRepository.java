package com.gestion.inventario.repository;

import com.gestion.inventario.model.Presentation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PresentationRepository extends JpaRepository<Presentation, Long> {
    List<Presentation> findByItemId(Long itemId);
    Optional<Presentation> findByQrCode(String qrCode);
}
