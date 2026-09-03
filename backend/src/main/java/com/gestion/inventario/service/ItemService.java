package com.gestion.inventario.service;

import com.gestion.inventario.dto.InsumoViewDTO;
import com.gestion.inventario.dto.ItemRequestDTO;
import com.gestion.inventario.dto.PresentationRequestDTO;
import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.repository.ItemRepository;
import com.gestion.inventario.repository.PresentationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Fase 16 — Catálogo de materiales con presentaciones múltiples.
 * Un material (Item) agrupa variantes (Presentation); el stock y los
 * niveles min/max viven en la variante.
 */
@Service
public class ItemService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private PresentationRepository presentationRepository;

    @Transactional
    public Item crearItem(ItemRequestDTO request) {
        if (request.getCode() == null || request.getName() == null || request.getName().isBlank()) {
            throw new IllegalArgumentException("Código y nombre del material son obligatorios.");
        }
        boolean codigoDuplicado = itemRepository.findAll().stream()
                .anyMatch(i -> i.getCode().equals(request.getCode()));
        if (codigoDuplicado) {
            throw new IllegalArgumentException("Ya existe un material con el código interno " + request.getCode() + ".");
        }

        Item item = new Item();
        item.setCode(request.getCode());
        item.setName(request.getName().trim());
        for (PresentationRequestDTO presReq : request.getPresentations()) {
            Presentation presentation = aplicarPresentacion(new Presentation(), presReq);
            presentation.setItem(item);
            item.addPresentation(presentation);
        }
        item = itemRepository.save(item);
        for (Presentation p : item.getPresentations()) {
            p.setQrCode(generarQrCode(p.getId()));
        }
        return itemRepository.save(item);
    }

    @Transactional
    public Item actualizarItem(Long id, ItemRequestDTO request) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Material no encontrado."));
        item.setCode(request.getCode() != null ? request.getCode() : item.getCode());
        item.setName(request.getName() != null && !request.getName().isBlank()
                ? request.getName().trim() : item.getName());
        return itemRepository.save(item);
    }

    @Transactional
    public Presentation agregarPresentacion(Long itemId, PresentationRequestDTO request) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Material no encontrado."));
        Presentation presentation = aplicarPresentacion(new Presentation(), request);
        presentation.setItem(item);
        presentation = presentationRepository.save(presentation);
        presentation.setQrCode(generarQrCode(presentation.getId()));
        return presentationRepository.save(presentation);
    }

    private String generarQrCode(Long presentationId) {
        return "SIGES-PRES-" + presentationId;
    }

    @Transactional
    public Presentation actualizarPresentacion(Long id, PresentationRequestDTO request) {
        Presentation presentation = presentationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Presentación no encontrada."));
        aplicarPresentacion(presentation, request);
        return presentationRepository.save(presentation);
    }

    @Transactional(readOnly = true)
    public List<Item> listarItems() {
        return itemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<InsumoViewDTO> listarVistaInsumos() {
        List<InsumoViewDTO> vista = new ArrayList<>();
        for (Item item : itemRepository.findAll()) {
            for (Presentation p : item.getPresentations()) {
                InsumoViewDTO dto = new InsumoViewDTO();
                dto.setId(p.getId());
                dto.setCode(item.getCode());
                dto.setItem(item.getName());
                dto.setPresentation(p.getName());
                dto.setSize(p.getSize());
                dto.setStock(p.getStock());
                dto.setMinStock(p.getMinStock());
                dto.setMaxStock(p.getMaxStock());
                dto.setEstimatedCost(p.getEstimatedCost());
                dto.setQrCode(p.getQrCode());
                vista.add(dto);
            }
        }
        return vista;
    }

    private Presentation aplicarPresentacion(Presentation target, PresentationRequestDTO request) {
        target.setName(request.getName().trim());
        target.setSize(request.getSize().trim());
        target.setMinStock(request.getMinStock() != null ? request.getMinStock() : 5);
        target.setMaxStock(request.getMaxStock() != null ? request.getMaxStock() : 50);
        target.setEstimatedCost(request.getEstimatedCost() != null ? request.getEstimatedCost() : java.math.BigDecimal.ZERO);
        return target;
    }

    @Transactional(readOnly = true)
    public Optional<Presentation> findPresentationByQrCode(String qrCode) {
        return presentationRepository.findByQrCode(qrCode);
    }

    @Transactional(readOnly = true)
    public Optional<Presentation> findPresentationById(Long id) {
        return presentationRepository.findById(id);
    }
}
