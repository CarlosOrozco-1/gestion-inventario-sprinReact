package com.gestion.inventario.service;

import com.gestion.inventario.exception.InsufficientStockException;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private MovimientoService movimientoService;

    private Presentation presentationPrueba;
    private Usuario usuarioPrueba;

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
    }

    @Test
    void debeLanzarExcepcionCuandoCantidadEsCero() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, "ENTRADA", 0, "Test", 1L);
        });
        assertEquals("La cantidad debe ser mayor a cero.", exception.getMessage());
    }

    @Test
    void debeLanzarExcepcionCuandoCantidadEsNegativa() {
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, "ENTRADA", -5, "Test", 1L);
        });
        assertEquals("La cantidad debe ser mayor a cero.", exception.getMessage());
    }

    @Test
    void debeIncrementarStockEnEntrada() {
        when(presentationRepository.findById(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioPrueba));

        Movimiento mockMovimiento = new Movimiento();
        when(movimientoRepository.save(any(Movimiento.class))).thenReturn(mockMovimiento);

        movimientoService.registrarMovimiento(1L, "ENTRADA", 20, "Compra nueva", 1L);

        assertEquals(70, presentationPrueba.getStock());
        verify(presentationRepository, times(1)).save(presentationPrueba);
        verify(movimientoRepository, times(1)).save(any(Movimiento.class));
    }

    @Test
    void debeLanzarExcepcionEnSalidaPorStockInsuficiente() {
        when(presentationRepository.findById(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioPrueba));

        // Intenta sacar 60, pero solo hay 50
        InsufficientStockException exception = assertThrows(InsufficientStockException.class, () -> {
            movimientoService.registrarMovimiento(1L, "SALIDA", 60, "Uso interno", 1L);
        });

        assertTrue(exception.getMessage().contains("Stock insuficiente"));
        verify(presentationRepository, never()).save(any(Presentation.class));
    }

    @Test
    void debeReducirStockEnSalidaExitosa() {
        when(presentationRepository.findById(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioPrueba));

        Movimiento mockMovimiento = new Movimiento();
        when(movimientoRepository.save(any(Movimiento.class))).thenReturn(mockMovimiento);

        movimientoService.registrarMovimiento(1L, "SALIDA", 30, "Uso en laboratorio", 1L);

        assertEquals(20, presentationPrueba.getStock());
        verify(presentationRepository, times(1)).save(presentationPrueba);
    }

    @Test
    void debeLanzarExcepcionEnAjusteSinJustificacion() {
        when(presentationRepository.findById(1L)).thenReturn(Optional.of(presentationPrueba));
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioPrueba));

        // Justificación muy corta (menor a 20 chars)
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            movimientoService.registrarMovimiento(1L, "AJUSTE_NEGATIVO", 5, "Mala", 1L);
        });

        assertTrue(exception.getMessage().contains("requieren una justificación (detalle) de al menos 20 caracteres"));
    }
}
