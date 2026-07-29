package com.gestion.inventario.service;

import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.InsumoRepository;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MovimientoService {

    @Autowired
    private MovimientoRepository movimientoRepository;

    @Autowired
    private InsumoRepository insumoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Transactional
    public Movimiento registrarMovimiento(Long insumoId, String tipo, Integer cantidad, String detalle, Long usuarioId) {
        
        // 1. Validar que la cantidad sea positiva
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        // 2. Buscar las entidades asociadas
        Insumo insumo = insumoRepository.findById(insumoId)
                .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado."));
                
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        // 3. Aplicar reglas de negocio según el tipo de movimiento
        switch (tipo.toUpperCase()) {
            case "ENTRADA":
            case "AJUSTE_POSITIVO":
                insumo.setStock(insumo.getStock() + cantidad);
                if (tipo.equalsIgnoreCase("ENTRADA")) {
                    insumo.setEntrada(insumo.getEntrada() + cantidad);
                }
                break;
                
            case "SALIDA":
            case "AJUSTE_NEGATIVO":
                if (cantidad > insumo.getStock()) {
                    throw new InsufficientStockException("Stock insuficiente. Solicitado: " + cantidad + ", Disponible: " + insumo.getStock());
                }
                insumo.setStock(insumo.getStock() - cantidad);
                break;
                
            default:
                throw new IllegalArgumentException("Tipo de movimiento inválido.");
        }

        // 4. Validar justificación si es un ajuste
        if (tipo.contains("AJUSTE") && (detalle == null || detalle.length() < 20)) {
            throw new IllegalArgumentException("Los ajustes requieren una justificación (detalle) de al menos 20 caracteres.");
        }

        // 5. Guardar los cambios (Spring Data JPA hace los UPDATE e INSERT por detrás)
        insumoRepository.save(insumo);

        Movimiento movimiento = new Movimiento();
        movimiento.setInsumo(insumo);
        movimiento.setTipo(tipo.toUpperCase());
        movimiento.setCantidad(cantidad);
        movimiento.setDetalle(detalle);
        movimiento.setUsuario(usuario);
        // Opcional: configurar mes y año si se requiere derivarlo del LocalDateTime.now()

        return movimientoRepository.save(movimiento);
    }

    @Transactional(readOnly = true)
    public java.util.List<com.gestion.inventario.dto.MovimientoResponseDTO> listarMovimientos() {
        return movimientoRepository.findAllByOrderByCreatedAtDesc().stream().map(mov -> {
            com.gestion.inventario.dto.MovimientoResponseDTO dto = new com.gestion.inventario.dto.MovimientoResponseDTO();
            dto.setId(mov.getId());
            dto.setTipo(mov.getTipo());
            dto.setCantidad(mov.getCantidad());
            dto.setDetalle(mov.getDetalle());
            dto.setCreatedAt(mov.getCreatedAt());
            // Hibernate ejecutará una consulta adicional (o usará caché) por cada acceso
            // pero estamos bajo @Transactional por lo que no habrá error de LazyLoading
            if (mov.getInsumo() != null) {
                dto.setInsumoNombre(mov.getInsumo().getInsumo());
                dto.setInsumoPresentacion(mov.getInsumo().getPresentacion() + " " + mov.getInsumo().getTamanoPresentacion());
            }
            if (mov.getUsuario() != null) {
                dto.setUsuarioNombre(mov.getUsuario().getNombre());
            }
            return dto;
        }).toList();
    }
}
