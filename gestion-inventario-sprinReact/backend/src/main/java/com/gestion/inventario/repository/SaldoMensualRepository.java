package com.gestion.inventario.repository;

import com.gestion.inventario.model.SaldoMensual;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SaldoMensualRepository extends JpaRepository<SaldoMensual, Long> {
    List<SaldoMensual> findByInsumoIdAndAnio(Long insumoId, Integer anio);
}
