package com.gestion.inventario.service;

import com.gestion.inventario.dto.SugerenciaStockDTO;
import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.repository.InsumoRepository;
import com.gestion.inventario.repository.MovimientoRepository;
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
    private InsumoRepository insumoRepository;

    @Mock
    private MovimientoRepository movimientoRepository;

    private SugerenciaStockService service() {
        return new SugerenciaStockService(insumoRepository, movimientoRepository, 90, 7, 30);
    }

    private Insumo insumo(int stock, Integer minimo, Integer maximo) {
        Insumo insumo = new Insumo();
        insumo.setId(1L);
        insumo.setNumero(1);
        insumo.setInsumo("Gasa");
        insumo.setPresentacion("Caja");
        insumo.setTamanoPresentacion("10x10");
        insumo.setStock(stock);
        insumo.setStockMinimo(minimo);
        insumo.setStockMaximo(maximo);
        insumo.setCostoEstimado(new BigDecimal("25.00"));
        return insumo;
    }

    private Movimiento movimiento(int cantidad) {
        Movimiento movimiento = new Movimiento();
        movimiento.setCantidad(cantidad);
        return movimiento;
    }

    @Test
    void debeSugerirMinYMaxSegunConsumoPromedioDiario() {
        when(insumoRepository.findAll()).thenReturn(List.of(insumo(10, 5, 50)));
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
        when(insumoRepository.findAll()).thenReturn(List.of(insumo(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(List.of(movimiento(15))); // 15/90 => 0.17

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertEquals(2, dto.getStockMinimoSugerido()); // ceil(0.17 * 7)  = ceil(1.19) = 2
        assertEquals(7, dto.getStockMaximoSugerido()); // ceil(0.17 * 37) = ceil(6.29) = 7
    }

    @Test
    void debeMarcarSinConsumoCuandoNoHayMovimientos() {
        when(insumoRepository.findAll()).thenReturn(List.of(insumo(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(List.of());

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertTrue(dto.isSinConsumo());
        assertNull(dto.getStockMinimoSugerido());
        assertNull(dto.getStockMaximoSugerido());
        assertFalse(dto.isDifiere());
    }

    @Test
    void debeMarcarDifiereFalsoCuandoYaCoincidenLosValores() {
        when(insumoRepository.findAll()).thenReturn(List.of(insumo(10, 7, 37)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(
                List.of(movimiento(30), movimiento(30), movimiento(30)));

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertEquals(7, dto.getStockMinimoSugerido());
        assertEquals(37, dto.getStockMaximoSugerido());
        assertFalse(dto.isDifiere());
    }

    @Test
    void debeGarantizarMaximoMayorAlMinimo() {
        when(insumoRepository.findAll()).thenReturn(List.of(insumo(10, 5, 50)));
        when(movimientoRepository.findConsumosDesde(eq(1L), any())).thenReturn(List.of(movimiento(3))); // CPD 0.03

        SugerenciaStockDTO dto = service().sugerirStock().get(0);

        assertTrue(dto.getStockMaximoSugerido() > dto.getStockMinimoSugerido());
    }
}
