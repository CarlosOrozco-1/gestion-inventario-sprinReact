package com.gestion.inventario.controller;

import com.gestion.inventario.dto.BitacoraDTO;
import com.gestion.inventario.model.Bitacora;
import com.gestion.inventario.repository.BitacoraRepository;
import com.gestion.inventario.websocket.WebSocketNotifier;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bitacora")
public class BitacoraController {

    @Autowired
    private BitacoraRepository bitacoraRepository;

    @Autowired
    private WebSocketNotifier webSocketNotifier;

    @GetMapping
    public List<Bitacora> listarBitacora() {
        return bitacoraRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/modulo/{modulo}")
    public List<Bitacora> listarPorModulo(@PathVariable String modulo) {
        return bitacoraRepository.findByModuloOrderByCreatedAtDesc(modulo.toUpperCase());
    }

    @GetMapping("/accion/{accion}")
    public List<Bitacora> listarPorAccion(@PathVariable String accion) {
        return bitacoraRepository.findByAccionOrderByCreatedAtDesc(accion.toUpperCase());
    }

    @PostMapping
    public ResponseEntity<Bitacora> registrarBitacora(@Valid @RequestBody BitacoraDTO request) {
        Bitacora bitacora = new Bitacora();
        bitacora.setAccion(request.getAccion());
        bitacora.setModulo(request.getModulo());
        bitacora.setDescripcion(request.getDescripcion());
        bitacora.setJustificacion(request.getJustificacion());
        bitacora.setUsuarioId(request.getUsuarioId());
        bitacora.setUsuarioNombre(request.getUsuarioNombre());
        bitacora.setEntidadId(request.getEntidadId());
        bitacora.setEntidadTipo(request.getEntidadTipo());
        bitacora.setDatosAnteriores(request.getDatosAnteriores());
        bitacora.setDatosNuevos(request.getDatosNuevos());

        Bitacora saved = bitacoraRepository.save(bitacora);
        webSocketNotifier.notificar("bitacora");
        return ResponseEntity.ok(saved);
    }
}
