package com.gestion.inventario.repository;

import com.gestion.inventario.model.Bitacora;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BitacoraRepository extends JpaRepository<Bitacora, Long> {
    List<Bitacora> findAllByOrderByCreatedAtDesc();
    List<Bitacora> findByModuloOrderByCreatedAtDesc(String modulo);
    List<Bitacora> findByAccionOrderByCreatedAtDesc(String accion);
    List<Bitacora> findByUsuarioIdOrderByCreatedAtDesc(Long usuarioId);
}
