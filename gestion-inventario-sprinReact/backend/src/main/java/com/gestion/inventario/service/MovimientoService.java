package com.gestion.inventario.service;

import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.model.Bitacora;
import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.BitacoraRepository;
import com.gestion.inventario.repository.InsumoRepository;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import com.gestion.inventario.websocket.WebSocketNotifier;
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

    @Autowired
    private BitacoraRepository bitacoraRepository;

    @Autowired
    private WebSocketNotifier webSocketNotifier;

    @Transactional
    public Movimiento registrarMovimiento(Long insumoId, String tipo, Integer cantidad, String detalle, Long usuarioId) {
        
        // 1. Validar que la cantidad sea positiva
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad debe ser mayor a cero.");
        }

        String tipoNorm = tipo != null ? tipo.toUpperCase().trim() : "";

        // 2. Validar longitud de justificación obligatoria según la operación
        int minChars = 10;
        if (tipoNorm.contains("REGULARIZACION") || tipoNorm.contains("AJUSTE")) {
            minChars = 20;
        } else if (tipoNorm.contains("CORRECCION")) {
            minChars = 15;
        }

        if (detalle == null || detalle.trim().length() < minChars) {
            throw new IllegalArgumentException("Para la operación '" + tipoNorm + "' se requiere una justificación obligatoria de al menos " + minChars + " caracteres.");
        }

        // 3. Buscar el insumo en la base de datos de manera robusta
        Insumo insumo = null;
        if (insumoId != null) {
            insumo = insumoRepository.findById(insumoId).orElse(null);
        }
        if (insumo == null) {
            insumo = insumoRepository.findAll().stream()
                    .filter(i -> i.getId().equals(insumoId) || (i.getNumero() != null && i.getNumero().longValue() == insumoId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Insumo no encontrado en la base de datos (ID: " + insumoId + ")."));
        }

        // 4. Obtener usuario de manera resiliente
        Usuario usuario = null;
        if (usuarioId != null) {
            usuario = usuarioRepository.findById(usuarioId).orElse(null);
        }
        if (usuario == null) {
            usuario = usuarioRepository.findAll().stream().findFirst().orElse(null);
        }
        if (usuario == null) {
            usuario = new Usuario();
            usuario.setNombre("Usuario Sistema");
            usuario.setEmail("sistema@inventario.com");
            usuario.setActivo(true);
            usuario = usuarioRepository.save(usuario);
        }

        int stockAnterior = insumo.getStock();

        // 5. Aplicar reglas de negocio según el tipo de movimiento
        switch (tipoNorm) {
            case "ENTRADA":
            case "REGULARIZACION_POSITIVA":
            case "CORRECCION_POSITIVA":
            case "AJUSTE_POSITIVO":
                insumo.setStock(insumo.getStock() + cantidad);
                if (tipoNorm.equals("ENTRADA")) {
                    insumo.setEntrada(insumo.getEntrada() + cantidad);
                }
                break;
                
            case "SALIDA":
            case "REGULARIZACION_NEGATIVA":
            case "CORRECCION_NEGATIVA":
            case "AJUSTE_NEGATIVO":
                if (cantidad > insumo.getStock()) {
                    throw new InsufficientStockException("Stock insuficiente. Solicitado: " + cantidad + ", Disponible: " + insumo.getStock());
                }
                insumo.setStock(insumo.getStock() - cantidad);
                break;
                
            default:
                throw new IllegalArgumentException("Tipo de movimiento inválido: " + tipo);
        }

        // 6. Guardar los cambios en el insumo
        insumoRepository.save(insumo);

        // 7. Guardar la entidad Movimiento
        Movimiento movimiento = new Movimiento();
        movimiento.setInsumo(insumo);
        movimiento.setTipo(tipoNorm);
        movimiento.setCantidad(cantidad);
        movimiento.setDetalle(detalle);
        movimiento.setUsuario(usuario);

        Movimiento saved = movimientoRepository.save(movimiento);

        // 8. Registrar automáticamente en la Bitácora de Auditoría
        String accionEtiqueta = tipoNorm;
        String moduloNombre = "MOVIMIENTOS";
        String desc = tipoNorm + " de " + cantidad + " unidades de " + insumo.getInsumo() + " (Stock: " + stockAnterior + " → " + insumo.getStock() + ")";

        Bitacora bitacora = new Bitacora();
        bitacora.setAccion(accionEtiqueta);
        bitacora.setModulo(moduloNombre);
        bitacora.setDescripcion(desc);
        bitacora.setJustificacion(detalle);
        bitacora.setUsuarioId(usuario.getId());
        bitacora.setUsuarioNombre(usuario.getNombre());
        bitacora.setEntidadId(insumo.getId());
        bitacora.setEntidadTipo("INSUMO");
        bitacora.setDatosAnteriores("{\"stock\": " + stockAnterior + "}");
        bitacora.setDatosNuevos("{\"stock\": " + insumo.getStock() + "}");
        bitacoraRepository.save(bitacora);

        // Notificar cambios en tiempo real a los clientes conectados
        webSocketNotifier.notificar("insumos");
        webSocketNotifier.notificar("movimientos");
        webSocketNotifier.notificar("bitacora");

        return saved;
    }
}
