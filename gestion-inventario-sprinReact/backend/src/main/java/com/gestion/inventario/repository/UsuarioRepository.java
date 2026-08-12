package com.gestion.inventario.repository;

import com.gestion.inventario.model.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    @EntityGraph(attributePaths = {"rol"})
    @Query("select u from Usuario u where lower(trim(u.email)) = lower(trim(:email))")
    Optional<Usuario> findByEmail(@Param("email") String email);
}
