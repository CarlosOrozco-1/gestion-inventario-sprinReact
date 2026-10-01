package com.gestion.inventario.service;

import com.gestion.inventario.dto.MovimientoResponseDTO;
import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.MovimientoTipo;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class MovimientoServiceTest {

    @Mock
    private MovimientoRepository movimientoRepository;

    @Mock
    private PresentationRepository presentationRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MovimientoService movimientoService;

    private Presentation presentationPrueba;
    private Usuario usuarioPrueba;
    private final String EMAIL = "test@inventario.com";

    @BeforeEach
    void setUp() {
        presentationPrueba = new Presentation();
        presentationPrueba.setId(1L);
        presentationPrueba.setStock(50);

        Item item = new Item();
        item.setId(1L);
        item.setCode(101);
        item.setName("Gasa E2E");
        presentationPrueba.setItem(item);

        usuarioPrueba = new Usuario();
        usuarioPrueba.setId(1L);
        usuarioPrueba.setName("Test User");
        usuarioPrueba.setEmail(EMAIL);
    }

    @Test
    void debeLanzarExcepcionCuandoCantidadEsCero() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, MovimientoTipo.ENTRADA, 0, "Test", EMAIL);
        });
        assertEquals("La cantidad debe ser mayor a cero.", exception.getMessage());
    }

    @Test
    void debeLanzarExcepcionCuandoCantidadEsNegativa() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, MovimientoTipo.ENTRADA, -5, "Test", EMAIL);
        });
        assertEquals("La cantidad debe ser mayor a cero.", exception.getMessage());
    }

    @Test
    void debeIncrementarStockEnEntrada() {
        when(presentationRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioPrueba));

        Movimiento mockMovimiento = new Movimiento();
        mockMovimiento.setId(1L);
        mockMovimiento.setType("ENTRADA");
        when(movimientoRepository.save(any(Movimiento.class))).thenReturn(mockMovimiento);

        movimientoService.registrarMovimiento(1L, MovimientoTipo.ENTRADA, 20, "Compra nueva", EMAIL);

        assertEquals(70, presentationPrueba.getStock());
        verify(presentationRepository, times(1)).save(presentationPrueba);
        verify(movimientoRepository, times(1)).save(any(Movimiento.class));
    }

    @Test
    void debeLanzarExcepcionEnSalidaPorStockInsuficiente() {
        when(presentationRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioPrueba));

        // Intenta sacar 60, pero solo hay 50
        InsufficientStockException exception = assertThrows(InsufficientStockException.class, () -> {
            movimientoService.registrarMovimiento(1L, MovimientoTipo.SALIDA, 60, "Uso interno", EMAIL);
        });

        assertTrue(exception.getMessage().contains("Stock insuficiente"));
        verify(presentationRepository, never()).save(any(Presentation.class));
    }

    @Test
    void debeReducirStockEnSalidaExitosa() {
        when(presentationRepository.findByIdForUpdate(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findByEmail(EMAIL)).thenReturn(Optional.of(usuarioPrueba));

        Movimiento mockMovimiento = new Movimiento();
        mockMovimiento.setId(1L);
        mockMovimiento.setType("SALIDA");
        when(movimientoRepository.save(any(Movimiento.class))).thenReturn(mockMovimiento);

        movimientoService.registrarMovimiento(1L, MovimientoTipo.SALIDA, 30, "Uso en laboratorio", EMAIL);

        assertEquals(20, presentationPrueba.getStock());
        verify(presentationRepository, times(1)).save(presentationPrueba);
    }

    @Test
    void debeLanzarExcepcionEnAjusteSinJustificacion() {
        // La justificación se valida ANTES de cargar usuario/presentación (no hace stubs).
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, MovimientoTipo.AJUSTE_NEGATIVO, 5, "Mala", EMAIL);
        });

        assertTrue(exception.getMessage().contains("requieren una justificación (detalle) de al menos 20 caracteres"));
    }

    @Test
    void debeRechazarTipoDeMovimientoNulo() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, null, 5, "Justificación suficientemente larga para el ajuste", EMAIL);
        });
        assertEquals("El tipo de movimiento es obligatorio.", exception.getMessage());
    }

    // --- Paginación del Kárdex ---

    private Movimiento movimientoConDatos(Long id) {
        Movimiento mov = new Movimiento();
        mov.setId(id);
        mov.setType(MovimientoTipo.ENTRADA.name());
        mov.setQuantity(3);
        mov.setDetail("Ingreso de prueba");
        mov.setCreatedAt(LocalDateTime.now());
        mov.setPresentation(presentationPrueba);
        mov.setUsuario(usuarioPrueba);
        return mov;
    }

    @Test
    void debeMapearLaPaginaDelKardexConSusDatosDePresentacionYUsuario() {
        Page<Movimiento> pagina = new PageImpl<>(
                List.of(movimientoConDatos(7L)), PageRequest.of(0, 10), 35L);
        when(movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(pagina);

        Page<MovimientoResponseDTO> resultado = movimientoService.listarMovimientosPaginado(0, 10);

        assertEquals(35, resultado.getTotalElements());
        assertEquals(4, resultado.getTotalPages());
        assertEquals(1, resultado.getContent().size());
        MovimientoResponseDTO dto = resultado.getContent().get(0);
        assertEquals(7L, dto.getId());
        assertEquals("Gasa E2E", dto.getItemName());
        assertEquals(usuarioPrueba.getName(), dto.getUsuarioName());
    }

    @Test
    void debeRespetarLaPaginaYElTamanoSolicitados() {
        when(movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(2, 5), 11L));

        Page<MovimientoResponseDTO> resultado = movimientoService.listarMovimientosPaginado(2, 5);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(movimientoRepository).findAllWithDetailsOrderByCreatedAtDesc(captor.capture());
        assertEquals(2, captor.getValue().getPageNumber());
        assertEquals(5, captor.getValue().getPageSize());
        assertEquals(11, resultado.getTotalElements());
    }

    @Test
    void debeAcotarElTamanoDePaginaParaNoDevolverElHistoricoEntero() {
        when(movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 100), 5000L));

        movimientoService.listarMovimientosPaginado(0, 100000);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(movimientoRepository).findAllWithDetailsOrderByCreatedAtDesc(captor.capture());
        assertEquals(100, captor.getValue().getPageSize());
    }

    @Test
    void debeCorregirPaginaNegativaYTamanoInvalido() {
        when(movimientoRepository.findAllWithDetailsOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 1), 0L));

        movimientoService.listarMovimientosPaginado(-5, 0);

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(movimientoRepository).findAllWithDetailsOrderByCreatedAtDesc(captor.capture());
        assertEquals(0, captor.getValue().getPageNumber());
        assertEquals(1, captor.getValue().getPageSize());
    }
}