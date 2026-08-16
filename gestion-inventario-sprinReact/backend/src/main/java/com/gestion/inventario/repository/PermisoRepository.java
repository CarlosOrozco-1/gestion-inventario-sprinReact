package com.gestion.inventario.repository;

import com.gestion.inventario.model.Permiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermisoRepository extends JpaRepository<Permiso, Long> {
    Optional<Permiso> findByCodigo(String codigo);

    List<Permiso> findByCodigoIn(List<String> codigos);
}
