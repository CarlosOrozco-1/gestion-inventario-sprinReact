package com.gestion.inventario.service;

import com.gestion.inventario.dto.PresentationRequestDTO;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.repository.ItemRepository;
import com.gestion.inventario.repository.PresentationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * El constraint uq_presentation_item_name_size de PostgreSQL hace único el par
 * nombre+tamaño dentro de un material. Estos tests fijan el comportamiento
 * esperado: responder 400 con un mensaje legible ANTES de escribir, en vez de
 * dejar que la base rechace el INSERT/UPDATE y el cliente reciba un 500.
 */
@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private PresentationRepository presentationRepository;

    @InjectMocks
    private ItemService itemService;

    private Item item;
    private PresentationRequestDTO request;

    @BeforeEach
    void setUp() {
        item = new Item();
        item.setId(1L);
        item.setCode(101);
        item.setName("Alcohol Etílico");
        item.setActivo(true);

        request = new PresentationRequestDTO();
        request.setName("Envase");
        request.setSize("1 Galón");
    }

    @Test
    void debeRechazarPresentacionDuplicadaEnElMismoMaterial() {
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(presentationRepository.findDuplicada(anyLong(), anyString(), anyString(), isNull()))
                .thenReturn(Optional.of(new Presentation()));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> itemService.agregarPresentacion(1L, request));

        assertTrue(ex.getMessage().contains("ya tiene una presentación"));
        assertTrue(ex.getMessage().contains("nombre y el tamaño deben ser distintos"));
        // Lo importante: no se intentó escribir nada.
        verify(presentationRepository, never()).save(any(Presentation.class));
    }

    @Test
    void debePermitirPresentacionConNombreDistinto() {
        request.setName("Botella");
        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(presentationRepository.findDuplicada(anyLong(), anyString(), anyString(), isNull()))
                .thenReturn(Optional.empty());
        when(presentationRepository.save(any(Presentation.class))).thenAnswer(inv -> {
            Presentation p = inv.getArgument(0);
            p.setId(7L);
            return p;
        });

        Presentation guardada = itemService.agregarPresentacion(1L, request);

        assertEquals(7L, guardada.getId());
        assertEquals("SIGES-PRES-7", guardada.getQrCode());
    }

    @Test
    void materialInexistenteDaErrorLegible() {
        when(itemRepository.findById(99L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> itemService.agregarPresentacion(99L, request));

        assertEquals("Material no encontrado.", ex.getMessage());
    }
}