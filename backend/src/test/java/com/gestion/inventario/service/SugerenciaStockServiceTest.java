package com.gestion.inventario.service;

import com.gestion.inventario.dto.SugerenciaStockDTO;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SugerenciaStockServiceTest {

    @Mock
    private PresentationRepository presentationRepository;

    @Mock
    private MovimientoRepository movimientoRepository;

    private SugerenciaStockService service() {
        return new SugerenciaStockService(presentationRepository, movimientoRepository, 90, 7, 30);
    }

    private Presentation presentation(int stock, Integer minimo, Integer maximo) {
        Item item = new Item();
        item.setId(1L);
        item.setCode(1);
        item.setName("Gasa");

        Presentation presentation = new Presentation();
        presentation.setId(1L);
        presentation.setItem(item);
        presentation.setName("Caja");
        presentation.setSize("10x10");
        presentation.setStock(stock);
        presentation.setMinStock(minimo);
        presentation.setMaxStock(maximo);
        presentation.setEstimatedCost(new BigDecimal("25.00"));
        return presentation;
    }

    private Movimiento movimiento(int cantidad) {
        Movimiento movimiento = new Movimiento();
        movimiento.setCantidad(cantidad);
        return movimiento;
    }

    @Test
    void debeSugerirMinYMaxSegunConsumoPromedioDiario() {
        when(presentationRepository.findAll()).thenReturn(List.of(presentation(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(
                List.of(movimiento(30), movimiento(30), movimiento(30))); // 90 en 90 días => CPD 1.0

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertEquals(0, new BigDecimal("1.00").compareTo(dto.getConsumoDiario()));
        assertEquals(7, dto.getStockMinimoSugerido());  // ceil(1.0 * 7)
        assertEquals(37, dto.getStockMaximoSugerido()); // ceil(1.0 * (7 + 30))
        assertTrue(dto.isDifiere());
        assertFalse(dto.isSinConsumo());
    }

    @Test
    void debeRedondearHaciaArribaElConsumoFraccionario() {
        when(presentationRepository.findAll()).thenReturn(List.of(presentation(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(List.of(movimiento(15))); // 15/90 => 0.17

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertEquals(2, dto.getStockMinimoSugerido()); // ceil(0.17 * 7)  = ceil(1.19) = 2
        assertEquals(7, dto.getStockMaximoSugerido()); // ceil(0.17 * 37) = ceil(6.29) = 7
    }

    @Test
    void debeMarcarSinConsumoCuandoNoHayMovimientos() {
        when(presentationRepository.findAll()).thenReturn(List.of(presentation(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(List.of());

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertTrue(dto.isSinConsumo());
        assertNull(dto.getStockMinimoSugerido());
        assertNull(dto.getStockMaximoSugerido());
        assertFalse(dto.isDifiere());
    }

    @Test
    void debeMarcarDifiereFalsoCuandoYaCoincidenLosValores() {
        when(presentationRepository.findAll()).thenReturn(List.of(presentation(10, 7, 37)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(
                List.of(movimiento(30), movimiento(30), movimiento(30)));

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertEquals(7, dto.getStockMinimoSugerido());
        assertEquals(37, dto.getStockMaximoSugerido());
        assertFalse(dto.isDifiere());
    }

    @Test
    void debeGarantizarMaximoMayorAlMinimo() {
        when(presentationRepository.findAll()).thenReturn(List.of(presentation(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(List.of(movimiento(3))); // CPD 0.03

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertTrue(dto.getStockMaximoSugerido() > dto.getStockMinimoSugerido());
    }
}
