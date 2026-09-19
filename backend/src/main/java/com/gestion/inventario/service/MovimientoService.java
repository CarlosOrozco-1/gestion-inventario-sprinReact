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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MovimientoService {

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

        // 1. Validar cantidad y tipo ANTES de tocar cualquier entidad.
        if (type == null) {
            throw new IllegalArgumentException("El tipo de movimiento es obligatorio.");
        }
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        // 2. Todo ajuste (positivo o negativo) exige justificación (regla de AGENTS.md).
        if (type.esAjuste() && (detail == null || detail.trim().length() < 20)) {
            throw new IllegalArgumentException("Los ajustes requieren una justificación (detalle) de al menos 20 caracteres.");
        }

        // 3. El usuario SIEMPRE viene del email del JWT autenticado (nunca del cliente).
        Usuario usuario = usuarioRepository.findByEmail(usuarioEmail)
                .orElseThrow(() -> new IllegalArgumentException("Usuario autenticado no encontrado."));

        // 4. Bloqueo pesimista: serializa el acceso a la fila para evitar que dos
        //    operaciones concurrentes lean el mismo stock (lost update).
        Presentation presentation = presentationRepository.findByIdForUpdate(presentationId)
                .orElseThrow(() -> new IllegalArgumentException("Presentación no encontrada."));

        // 5. Aplicar reglas de negocio según el tipo de movimiento.
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

        // 6. Guardar los cambios (Spring Data JPA hace los UPDATE e INSERT por detrás)
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

        // 7. Auditoría: registramos el movimiento en la bitácora
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
        return movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc().stream().map(mov -> {
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
        }).toList();
    }
}