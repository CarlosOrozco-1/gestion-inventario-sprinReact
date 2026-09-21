package com.gestion.inventario.service;

import com.gestion.inventario.model.AuditLog;
import com.gestion.inventario.repository.AuditLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuditServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private AuditService service() {
        return new AuditService(auditLogRepository, eventPublisher);
    }

    @Test
    void debeRegistrarEventoConDatosCompletos() {
        AuditLog guardado = new AuditLog();
        guardado.setId(10L);
        when(auditLogRepository.save(any(AuditLog.class))).thenReturn(guardado);

        AuditService auditService = service();
        AuditLog log = auditService.registrar(AuditService.LOGIN, "Inicio de sesión exitoso",
                "usuarios", 1L, "admin@inventario.com", "Administrador", "127.0.0.1");

        assertNotNull(log);
        assertEquals(10L, log.getId());
        verify(auditLogRepository).save(argThat(l ->
                AuditService.LOGIN.equals(l.getEventType())
                        && "127.0.0.1".equals(l.getIpAddress())
                        && "admin@inventario.com".equals(l.getUsuarioEmail())));
    }

    @Test
    void debeConsultarConFiltros() {
        when(auditLogRepository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(new AuditLog())));

        Page<AuditLog> resultado = service().listar("LOGIN", "admin", null, null, 0, 20);

        assertEquals(1, resultado.getTotalElements());
        ArgumentCaptor<PageRequest> captor = ArgumentCaptor.forClass(PageRequest.class);
        verify(auditLogRepository).findAll(any(Specification.class), captor.capture());
        assertEquals(20, captor.getValue().getPageSize());
        assertEquals(0, captor.getValue().getPageNumber());
    }

    @Test
    void catálogoDebeSerDeterminísticoParaElFrontend() {
        var catalogo = service().catalogoEventos();
        assertEquals("Inicio de sesión", catalogo.get(AuditService.LOGIN));
        assertEquals("Movimiento registrado", catalogo.get(AuditService.MOVIMIENTO_CREADO));
        assertEquals("Exportación PDF", catalogo.get(AuditService.EXPORTACION_PDF));
        assertEquals(20, catalogo.size());
    }
}