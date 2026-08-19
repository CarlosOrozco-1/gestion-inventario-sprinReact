package com.gestion.inventario.repository;

import com.gestion.inventario.model.Insumo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InsumoRepository extends JpaRepository<Insumo, Long> {
    Optional<Insumo> findByCodigoQr(String codigoQr);
}
