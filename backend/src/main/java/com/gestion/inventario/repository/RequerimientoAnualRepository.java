package com.gestion.inventario.repository;

import com.gestion.inventario.model.RequerimientoAnual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RequerimientoAnualRepository extends JpaRepository<RequerimientoAnual, Long> {
    Optional<RequerimientoAnual> findByInsumoIdAndYear(Long insumoId, Integer year);
}
