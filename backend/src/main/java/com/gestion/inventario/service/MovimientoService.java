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

    @Transactional
    public Movimiento registrarMovimiento(Long presentationId, String tipo, Integer cantidad, String detalle, Long usuarioId) {

        // 1. Validar que la cantidad sea positiva
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        // 2. Buscar las entidades asociadas
        Presentation presentation = presentationRepository.findById(presentationId)
                .orElseThrow(() -> new IllegalArgumentException("Presentación no encontrada."));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        // 3. Aplicar reglas de negocio según el tipo de movimiento
        switch (tipo.toUpperCase()) {
            case "ENTRADA":
            case "AJUSTE_POSITIVO":
                presentation.setStock(presentation.getStock() + cantidad);
                break;

            case "SALIDA":
            case "AJUSTE_NEGATIVO":
                if (cantidad > presentation.getStock()) {
                    throw new InsufficientStockException("Stock insuficiente. Solicitado: " + cantidad + ", Disponible: " + presentation.getStock());
                }
                presentation.setStock(presentation.getStock() - cantidad);
                break;

            default:
                throw new IllegalArgumentException("Tipo de movimiento inválido.");
        }

        // 4. Validar justificación si es un ajuste
        if (tipo.contains("AJUSTE") && (detalle == null || detalle.length() < 20)) {
            throw new IllegalArgumentException("Los ajustes requieren una justificación (detalle) de al menos 20 caracteres.");
        }

        // 5. Guardar los cambios (Spring Data JPA hace los UPDATE e INSERT por detrás)
        presentationRepository.save(presentation);

        Movimiento movimiento = new Movimiento();
        movimiento.setPresentation(presentation);
        movimiento.setTipo(tipo.toUpperCase());
        movimiento.setCantidad(cantidad);
        movimiento.setDetalle(detalle);
        movimiento.setUsuario(usuario);
        // Opcional: configurar mes y año si se requiere derivarlo del LocalDateTime.now()

        return movimientoRepository.save(movimiento);
    }

    @Transactional(readOnly = true)
    public List<MovimientoResponseDTO> listarMovimientos() {
        return movimientoRepository.findAllByOrderByCreatedAtDesc().stream().map(mov -> {
            MovimientoResponseDTO dto = new MovimientoResponseDTO();
            dto.setId(mov.getId());
            dto.setTipo(mov.getTipo());
            dto.setCantidad(mov.getCantidad());
            dto.setDetalle(mov.getDetalle());
            dto.setCreatedAt(mov.getCreatedAt());
            // Hibernate ejecutará una consulta adicional (o usará caché) por cada acceso
            // pero estamos bajo @Transactional por lo que no habrá error de LazyLoading
            if (mov.getPresentation() != null && mov.getPresentation().getItem() != null) {
                dto.setInsumoNombre(mov.getPresentation().getItem().getName());
                dto.setInsumoPresentacion(mov.getPresentation().getName() + " " + mov.getPresentation().getSize());
            }
            if (mov.getUsuario() != null) {
                dto.setUsuarioNombre(mov.getUsuario().getNombre());
            }
            return dto;
        }).toList();
    }
}
