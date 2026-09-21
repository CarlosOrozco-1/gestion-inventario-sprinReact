package com.gestion.inventario.service;

import com.gestion.inventario.model.AuditLog;
import com.gestion.inventario.repository.AuditLogRepository;
import com.gestion.inventario.websocket.AuditLogSavedEvent;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Bitácora de auditoría: registra y consulta los eventos del sistema.
 * El registro es solo de escritura/lectura (append-only); no existe
 * forma de editar o borrar un registro desde la API.
 *
 * Eventos soportados (código -> etiqueta visible) en {@link #catalogoEventos()}.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    public static final String LOGIN = "LOGIN";
    public static final String LOGIN_FALLIDO = "LOGIN_FALLIDO";
    public static final String MOVIMIENTO_CREADO = "MOVIMIENTO_CREADO";
    public static final String USUARIO_CREADO = "USUARIO_CREADO";
    public static final String USUARIO_ACTUALIZADO = "USUARIO_ACTUALIZADO";
    public static final String USUARIO_ROL_CAMBIADO = "USUARIO_ROL_CAMBIADO";
    public static final String USUARIO_ESTADO_CAMBIADO = "USUARIO_ESTADO_CAMBIADO";
    public static final String EXPORTACION_PDF = "EXPORTACION_PDF";
    public static final String EXPORTACION_EXCEL = "EXPORTACION_EXCEL";
    public static final String EXPORTACION_PROYECCIONES_PDF = "EXPORTACION_PROYECCIONES_PDF";
    public static final String EXPORTACION_PROYECCIONES_EXCEL = "EXPORTACION_PROYECCIONES_EXCEL";
    public static final String INSUMO_CREADO = "INSUMO_CREADO";
    public static final String INSUMO_ACTUALIZADO = "INSUMO_ACTUALIZADO";
    public static final String INSUMO_INACTIVADO = "INSUMO_INACTIVADO";
    public static final String INSUMO_REACTIVADO = "INSUMO_REACTIVADO";
    public static final String PRESENTACION_AGREGADA = "PRESENTACION_AGREGADA";
    public static final String QR_DESCARGA = "QR_DESCARGA";
    public static final String QR_IMPRESION = "QR_IMPRESION";
    public static final String QR_CONSULTADO = "QR_CONSULTADO";
    public static final String PASSWORD_CAMBIADO = "PASSWORD_CAMBIADO";

    private final AuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
 * Escribe un evento en la bitácora. Se usa REQUIRES_NEW para poder registrar
 * también desde métodos marcados como {@code @Transactional(readOnly = true)}
 * (las exportaciones de Reportes) sin quedar atrapado en una transacción
 * de solo lectura.
 */
@Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuditLog registrar(String eventType, String description, String entityName, Long entityId,
                              String usuarioEmail, String usuarioName, String ipAddress) {
        AuditLog log = new AuditLog();
        log.setEventType(eventType);
        log.setDescription(description);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setUsuarioEmail(usuarioEmail);
        log.setUsuarioName(usuarioName);
        log.setIpAddress(ipAddress);
        AuditLog saved = auditLogRepository.save(log);
        // Notifica a los clientes WebSocket conectados (página de Auditoría se refresca sola).
        eventPublisher.publishEvent(new AuditLogSavedEvent(this, saved));
        return saved;
    }

    /** Listado paginado, más reciente primero, con filtros opcionales. */
    @Transactional(readOnly = true)
    public Page<AuditLog> listar(String evento, String usuarioBuscado, LocalDate desde, LocalDate hasta,
                                 int page, int size) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (evento != null && !evento.isBlank()) {
                predicates.add(cb.equal(root.get("eventType"), evento));
            }
            if (usuarioBuscado != null && !usuarioBuscado.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("usuarioEmail")),
                        "%" + usuarioBuscado.toLowerCase() + "%"));
            }
            if (desde != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), desde.atStartOfDay()));
            }
            if (hasta != null) {
                predicates.add(cb.lessThan(root.get("createdAt"), untilInclusive(hasta)));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return auditLogRepository.findAll(spec, pageable);
    }

    private static LocalDate untilInclusive(LocalDate date) {
        // El campo es TIMESTAMP: se cierra el rango al inicio del día siguiente.
        return date.plusDays(1);
    }

    /** Catálogo código -> etiqueta (para filtros y badges del frontend). */
    public Map<String, String> catalogoEventos() {
        Map<String, String> catalogo = new LinkedHashMap<>();
        catalogo.put(LOGIN, "Inicio de sesión");
        catalogo.put(LOGIN_FALLIDO, "Inicio de sesión fallido");
        catalogo.put(MOVIMIENTO_CREADO, "Movimiento registrado");
        catalogo.put(USUARIO_CREADO, "Usuario creado");
        catalogo.put(USUARIO_ACTUALIZADO, "Usuario actualizado");
        catalogo.put(USUARIO_ROL_CAMBIADO, "Rol de usuario cambiado");
        catalogo.put(USUARIO_ESTADO_CAMBIADO, "Estado de usuario cambiado");
        catalogo.put(EXPORTACION_PDF, "Exportación PDF");
        catalogo.put(EXPORTACION_EXCEL, "Exportación Excel");
        catalogo.put(EXPORTACION_PROYECCIONES_PDF, "Exportación PDF de Proyecciones");
        catalogo.put(EXPORTACION_PROYECCIONES_EXCEL, "Exportación Excel de Proyecciones");
        catalogo.put(INSUMO_CREADO, "Insumo creado");
        catalogo.put(INSUMO_ACTUALIZADO, "Insumo actualizado");
        catalogo.put(INSUMO_INACTIVADO, "Insumo inactivado");
        catalogo.put(INSUMO_REACTIVADO, "Insumo reactivado");
        catalogo.put(PRESENTACION_AGREGADA, "Presentación agregada a insumo");
        catalogo.put(QR_DESCARGA, "Código QR descargado");
        catalogo.put(QR_IMPRESION, "Código QR impreso");
        catalogo.put(QR_CONSULTADO, "Código QR consultado (escaneo)");
        catalogo.put(PASSWORD_CAMBIADO, "Contraseña cambiada");
        return catalogo;
    }
}