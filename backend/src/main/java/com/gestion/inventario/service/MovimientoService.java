package com.gestion.inventario.service;

import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.dto.MovimientoResponseDTO;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public Movimiento registrarMovimiento(Long presentationId, String type, Integer quantity, String detail, Long usuarioId) {
        return registrarMovimiento(presentationId, type, quantity, detail, usuarioId, null);
    }

    @Transactional
    public Movimiento registrarMovimiento(Long presentationId, String type, Integer quantity, String detail, Long usuarioId, String ip) {

        // 1. Validar que la cantidad sea positiva
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        // 2. Buscar las entidades asociadas
        Presentation presentation = presentationRepository.findById(presentationId)
                .orElseThrow(() -> new IllegalArgumentException("Presentación no encontrada."));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        // 3. Aplicar reglas de negocio según el tipo de movimiento
        switch (type.toUpperCase()) {
            case "ENTRADA":
            case "AJUSTE_POSITIVO":
                presentation.setStock(presentation.getStock() + quantity);
                break;

            case "SALIDA":
            case "AJUSTE_NEGATIVO":
                if (quantity > presentation.getStock()) {
                    throw new InsufficientStockException("Stock insuficiente. Solicitado: " + quantity + ", Disponible: " + presentation.getStock());
                }
                presentation.setStock(presentation.getStock() - quantity);
                break;

            default:
                throw new IllegalArgumentException("Tipo de movimiento inválido.");
        }

        // 4. Validar justificación si es un ajuste
        if (type.contains("AJUSTE") && (detail == null || detail.length() < 20)) {
            throw new IllegalArgumentException("Los ajustes requieren una justificación (detalle) de al menos 20 caracteres.");
        }

        // 5. Guardar los cambios (Spring Data JPA hace los UPDATE e INSERT por detrás)
        presentationRepository.save(presentation);

        Movimiento movimiento = new Movimiento();
        movimiento.setPresentation(presentation);
        movimiento.setType(type.toUpperCase());
        movimiento.setQuantity(quantity);
        movimiento.setDetail(detail);
        movimiento.setUsuario(usuario);
        // Opcional: configurar mes y año si se requiere derivarlo del LocalDateTime.now()

        movimiento = movimientoRepository.save(movimiento);

        // 6. Auditoría: registramos el movimiento en la bitácora
        String etiquetaTipo = switch (movimiento.getType()) {
            case "ENTRADA" -> "Entrada";
            case "SALIDA" -> "Salida";
            case "AJUSTE_POSITIVO" -> "Ajuste positivo (sobrante)";
            case "AJUSTE_NEGATIVO" -> "Ajuste negativo (merma)";
            default -> movimiento.getType();
        };
        auditService.registrar(AuditService.MOVIMIENTO_CREADO,
                etiquetaTipo + " de " + quantity + " unidades - "
                        + presentation.getItem().getName() + " (" + presentation.getName() + " "
                        + presentation.getSize() + ")",
                "inventario_movimientos", movimiento.getId(),
                usuario.getEmail(), usuario.getName(), ip);

        return movimiento;
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponseDTO> listarMovimientos() {
        return movimientoRepository.findAllByOrderByCreatedAtDesc().stream().map(mov -> {
            MovimientoResponseDTO dto = new MovimientoResponseDTO();
            dto.setId(mov.getId());
            dto.setType(mov.getType());
            dto.setQuantity(mov.getQuantity());
            dto.setDetail(mov.getDetail());
            dto.setCreatedAt(mov.getCreatedAt());
            // Hibernate ejecutará una consulta adicional (o usará caché) por cada acceso
            // pero estamos bajo @Transactional por lo que no habrá error de LazyLoading
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
