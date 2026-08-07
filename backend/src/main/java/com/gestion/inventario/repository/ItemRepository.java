package com.gestion.inventario.repository;

import com.gestion.inventario.model.Item;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {

    // Evita N+1 cargando las presentaciones de cada item
    @Override
    @EntityGraph(attributePaths = "presentations")
    List<Item> findAll();
}
