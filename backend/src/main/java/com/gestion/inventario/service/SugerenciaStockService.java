package com.gestion.inventario.service;

import com.gestion.inventario.dto.SugerenciaStockDTO;
import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.repository.InsumoRepository;
import com.gestion.inventario.repository.MovimientoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Fase 10 — Criterios avanzados de stockMinimo/stockMaximo según consumo.
 * Se infiere el consumo promedio diario (CPD) a partir de las salidas y
 * ajustes negativos registrados en la ventana de tiempo configurada:
 *
 *   Consumo diario   = total consumido / ventanaDias
 *   Stock mínimo     = ceil(CPD * leadTimeDias)              (punto de reorden)
 *   Stock máximo     = ceil(CPD * (leadTimeDias + cobertura)) (meta de compra)
 *
 * Parámetros configurables en application.properties:
 *   inventario.proyeccion.ventana-dias     (default 90)
 *   inventario.proyeccion.lead-time-dias   (default 7)
 *   inventario.proyeccion.dias-cobertura   (default 30)
 */
@Service
public class SugerenciaStockService {

    private final InsumoRepository insumoRepository;
    private final MovimientoRepository movimientoRepository;
    private final int ventanaDias;
    private final int leadTimeDias;
    private final int diasCobertura;

    public SugerenciaStockService(InsumoRepository insumoRepository,
                                  MovimientoRepository movimientoRepository,
                                  @Value("${inventario.proyeccion.ventana-dias:90}") int ventanaDias,
                                  @Value("${inventario.proyeccion.lead-time-dias:7}") int leadTimeDias,
                                  @Value("${inventario.proyeccion.dias-cobertura:30}") int diasCobertura) {
        this.insumoRepository = insumoRepository;
        this.movimientoRepository = movimientoRepository;
        this.ventanaDias = ventanaDias;
        this.leadTimeDias = leadTimeDias;
        this.diasCobertura = diasCobertura;
    }

    @Transactional(readOnly = true)
    public List<SugerenciaStockDTO> sugerirStock() {
        LocalDateTime desde = LocalDateTime.now().minusDays(ventanaDias);
        List<SugerenciaStockDTO> sugerencias = new ArrayList<>();

        for (Insumo insumo : insumoRepository.findAll()) {
            long totalConsumido = movimientoRepository.findConsumosDesde(insumo.getId(), desde).stream()
                    .mapToLong(Movimiento::getCantidad)
                    .sum();

            SugerenciaStockDTO dto = new SugerenciaStockDTO();
            dto.setId(insumo.getId());
            dto.setNumero(insumo.getNumero());
            dto.setInsumo(insumo.getInsumo());
            dto.setPresentacion(insumo.getPresentacion());
            dto.setTamanoPresentacion(insumo.getTamanoPresentacion());
            dto.setStock(insumo.getStock());
            dto.setCostoEstimado(insumo.getCostoEstimado());
            dto.setStockMinimoActual(insumo.getStockMinimo());
            dto.setStockMaximoActual(insumo.getStockMaximo());

            if (totalConsumido <= 0) {
                dto.setConsumoDiario(BigDecimal.ZERO);
                dto.setSinConsumo(true);
                dto.setDifiere(false);
                sugerencias.add(dto);
                continue;
            }

            BigDecimal consumoDiario = BigDecimal.valueOf(totalConsumido)
                    .divide(BigDecimal.valueOf(ventanaDias), 2, RoundingMode.HALF_UP);

            int minimoSugerido = ceilEntero(consumoDiario.multiply(BigDecimal.valueOf(leadTimeDias)));
            int maximoSugerido = ceilEntero(consumoDiario.multiply(BigDecimal.valueOf(leadTimeDias + diasCobertura)));

            if (minimoSugerido < 1) {
                minimoSugerido = 1;
            }
            if (maximoSugerido <= minimoSugerido) {
                maximoSugerido = minimoSugerido + 1;
            }

            dto.setConsumoDiario(consumoDiario);
            dto.setStockMinimoSugerido(minimoSugerido);
            dto.setStockMaximoSugerido(maximoSugerido);
            dto.setSinConsumo(false);
            dto.setDifiere(!Objects.equals(insumo.getStockMinimo(), minimoSugerido)
                    || !Objects.equals(insumo.getStockMaximo(), maximoSugerido));
            sugerencias.add(dto);
        }

        return sugerencias;
    }

    private int ceilEntero(BigDecimal valor) {
        return valor.setScale(0, RoundingMode.CEILING).intValueExact();
    }
}
