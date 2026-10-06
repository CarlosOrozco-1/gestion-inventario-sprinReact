package com.gestion.inventario.service;

import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.dto.MovimientoResponseDTO;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.MovimientoTipo;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MovimientoService {

    /** Tope del tamaño de página del Kárdex: evita que el cliente pida el histórico entero. */
    private static final int MAX_SIZE_PAGINA = 100;

    /** ADMIN y JEFE son los unicos autorizados a justificar y aplicar ajustes de stock. */
    private boolean esJefeOAdmin(Usuario usuario) {
        if (usuario.getRol() == null || usuario.getRol().getName() == null) {
            return false;
        }
        String rol = usuario.getRol().getName().toUpperCase();
        return "ADMIN".equals(rol) || "JEFE".equals(rol);
    }

    @Autowired
    private MovimientoRepository movimientoRepository;

    @Autowired
    private PresentationRepository presentationRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AuditService auditService;

    @Transactional
    public Movimiento registrarMovimiento(Long presentationId, MovimientoTipo type, Integer quantity, String detail, String usuarioEmail) {
        return registrarMovimiento(presentationId, type, quantity, detail, usuarioEmail, null);
    }

    @Transactional
    public Movimiento registrarMovimiento(Long presentationId, MovimientoTipo type, Integer quantity, String detail, String usuarioEmail, String ip) {

        // 1. El tipo es lo primero: sin el no se puede ni saber si es un ajuste.
        if (type == null) {
            throw new IllegalArgumentException("El tipo de movimiento es obligatorio.");
        }

        // 2. El usuario SIEMPRE viene del email del JWT autenticado (nunca del cliente).
        Usuario usuario = usuarioRepository.findByEmail(usuarioEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado."));

        // 3. PERMISOS antes que validacion de negocio, y no al reves. Los ajustes
        //    son exclusivos de ADMIN y JEFE: el modulo /ajustes no le aparece al
        //    AUXILIAR en la UI, pero /movimientos es un endpoint compartido con
        //    entradas y salidas, asi que sin esta comprobacion un AUXILIAR podria
        //    meter un AJUSTE_* por la API. Va en el service y no en el controller
        //    para que ningun camino de entrada lo esquive.
        //    Autorizar primero tambien evita darle informacion de negocio ("la
        //    justificacion es muy corta") a quien no tiene permiso de adjustments.
        //    Si el usuario viniera sin rol, se deniega: fallar cerrado.
        if (type.esAjuste() && !esJefeOAdmin(usuario)) {
            throw new AccessDeniedException("Registrar ajustes es una accion exclusiva de ADMIN y JEFE.");
        }

        // 4. Validar cantidad ANTES de tocar cualquier entidad.
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        // 5. Todo ajuste (positivo o negativo) exige justificación (regla de AGENTS.md).
        if (type.esAjuste() && (detail == null || detail.trim().length() < 20)) {
            throw new IllegalArgumentException("Los ajustes requieren una justificación (detalle) de al menos 20 caracteres.");
        }

        // 6. Bloqueo pesimista: serializa el acceso a la fila para evitar que dos
        //    operaciones concurrentes lean el mismo stock (lost update).
        Presentation presentation = presentationRepository.findByIdForUpdate(presentationId)
                .orElseThrow(() -> new IllegalArgumentException("Presentación no encontrada."));

        // 6b. Material o presentación inactivos: no se permiten movimientos
        // (eliminación lógica, V8 y V9). El stock de un inactivo queda
        // retenido hasta que alguien con permiso lo reactive.
        if (presentation.getItem() != null && !Boolean.TRUE.equals(presentation.getItem().getActivo())) {
            throw new IllegalArgumentException("El insumo está inactivo. No se pueden registrar movimientos.");
        }
        if (!Boolean.TRUE.equals(presentation.getActivo())) {
            throw new IllegalArgumentException(
                    "La presentación está inactiva. No se pueden registrar movimientos.");
        }

        // 7. Aplicar reglas de negocio según el tipo de movimiento.
        switch (type) {
            case ENTRADA:
            case AJUSTE_POSITIVO:
                presentation.setStock(presentation.getStock() + quantity);
                break;

            case SALIDA:
            case AJUSTE_NEGATIVO:
                if (quantity > presentation.getStock()) {
                    throw new InsufficientStockException("Stock insuficiente. Solicitado: " + quantity + ", Disponible: " + presentation.getStock());
                }
                presentation.setStock(presentation.getStock() - quantity);
                break;
        }

        // 8. Guardar los cambios (Spring Data JPA hace los UPDATE e INSERT por detrás)
        presentationRepository.save(presentation);

        Movimiento movimiento = new Movimiento();
        movimiento.setPresentation(presentation);
        movimiento.setType(type.name());
        movimiento.setQuantity(quantity);
        movimiento.setDetail(detail);
        movimiento.setUsuario(usuario);
        // Mes/año derivados de la fecha de creación (columnas usadas en reportes/agrupaciones).
        LocalDateTime ahora = LocalDateTime.now();
        movimiento.setMonth(ahora.getMonthValue());
        movimiento.setYear(ahora.getYear());

        movimiento = movimientoRepository.save(movimiento);

        // 9. Auditoría: registramos el movimiento en la bitácora
        auditService.registrar(AuditService.MOVIMIENTO_CREADO,
                type.getEtiqueta() + " de " + quantity + " unidades - "
                        + presentation.getItem().getName() + " (" + presentation.getName() + " "
                        + presentation.getSize() + ")",
                "inventario_movimientos", movimiento.getId(),
                usuario.getEmail(), usuario.getName(), ip);

        return movimiento;
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponseDTO> listarMovimientos() {
        // EntityGraph precarga presentation/item/usuario (evita N+1).
        return movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc().stream()
                .map(this::aDTO)
                .toList();
    }

    /**
     * Kárdex paginado. El módulo de Movimientos crece con cada operación, así que
     * se pagina en el servidor en lugar de enviar el histórico completo.
     */
    @Transactional(readOnly = true)
    public Page<MovimientoResponseDTO> listarMovimientosPaginado(int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampSize(size));
        return movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc(pageable)
                .map(this::aDTO);
    }

    /** Límite duro del tamaño de página para no permitir que el cliente pida el histórico entero. */
    private int clampSize(int size) {
        return Math.min(Math.max(size, 1), MAX_SIZE_PAGINA);
    }

    private MovimientoResponseDTO aDTO(Movimiento mov) {
        MovimientoResponseDTO dto = new MovimientoResponseDTO();
        dto.setId(mov.getId());
        dto.setType(mov.getType());
        dto.setQuantity(mov.getQuantity());
        dto.setDetail(mov.getDetail());
        dto.setCreatedAt(mov.getCreatedAt());
        if (mov.getPresentation() != null && mov.getPresentation().getItem() != null) {
            dto.setItemName(mov.getPresentation().getItem().getName());
            dto.setPresentationName(mov.getPresentation().getName() + " " + mov.getPresentation().getSize());
        }
        if (mov.getUsuario() != null) {
            dto.setUsuarioName(mov.getUsuario().getName());
        }
        return dto;
    }
}