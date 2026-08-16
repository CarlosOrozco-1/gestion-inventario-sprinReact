package com.gestion.inventario.controller;

import com.gestion.inventario.dto.RolPermisosRequest;
import com.gestion.inventario.dto.RolResponse;
import com.gestion.inventario.model.Permiso;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.repository.PermisoRepository;
import com.gestion.inventario.repository.RolRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RolController {

    private final RolRepository rolRepository;
    private final PermisoRepository permisoRepository;

    public RolController(RolRepository rolRepository, PermisoRepository permisoRepository) {
        this.rolRepository = rolRepository;
        this.permisoRepository = permisoRepository;
    }

    @GetMapping
    public List<RolResponse> listar() {
        return rolRepository.findAllByOrderByNivelDesc().stream()
                .map(RolResponse::from)
                .toList();
    }

    @PutMapping("/{id}/permisos")
    @PreAuthorize("hasAuthority('PERM_roles.gestionar')")
    public RolResponse actualizarPermisos(@PathVariable Long id, @RequestBody RolPermisosRequest request) {
        Rol rol = rolRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rol no encontrado."));

        List<String> codigos = request.getPermisos() == null ? List.of() : request.getPermisos();
        List<Permiso> permisos = codigos.isEmpty()
                ? new ArrayList<>()
                : new ArrayList<>(permisoRepository.findByCodigoIn(codigos));

        rol.setPermisos(permisos);
        return RolResponse.from(rolRepository.save(rol));
    }
}
