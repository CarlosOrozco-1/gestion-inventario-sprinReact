package com.gestion.inventario.config;

import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.ItemRepository;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private RolRepository rolRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private ItemRepository itemRepository;
    @Mock
    private PresentationRepository presentationRepository;
    @Mock
    private MovimientoRepository movimientoRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private DataSeeder seeder;
    private Usuario admin;
    private final List<Item> items = new ArrayList<>();
    private final List<Item> savedItems = new ArrayList<>();

    @BeforeEach
    void setUp() throws ReflectiveOperationException {
        seeder = new DataSeeder(rolRepository, usuarioRepository, itemRepository,
                presentationRepository, movimientoRepository, passwordEncoder);
        setField("adminEmail", "admin@local.test");
        setField("adminPassword", "local-test-password");

        Rol rolAdmin = new Rol();
        rolAdmin.setId(1L);
        rolAdmin.setName("ADMIN");
        admin = new Usuario();
        admin.setId(1L);
        admin.setName("Administrador");
        admin.setEmail("admin@local.test");
        admin.setRol(rolAdmin);

        when(rolRepository.findByName("admin")).thenReturn(Optional.empty());
        when(rolRepository.findByName("ADMIN")).thenReturn(Optional.of(rolAdmin));
        when(rolRepository.findByName("JEFE")).thenReturn(Optional.empty());
        when(rolRepository.findByName("AUXILIAR")).thenReturn(Optional.empty());
        when(rolRepository.save(any(Rol.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(usuarioRepository.findByEmail("admin@local.test")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("local-test-password", null)).thenReturn(true);
    }

    @Test
    void siLaBaseYaTieneCatalogoPeroNoMovimientosCompletaElHistorialSinDescuadrarStock() throws Exception {
        setField("demoDataEnabled", true);
        when(usuarioRepository.findAll()).thenReturn(List.of(admin));
        when(itemRepository.findAll()).thenAnswer(invocation -> items);
        AtomicLong itemId = new AtomicLong(1);
        when(itemRepository.save(any(Item.class))).thenAnswer(invocation -> {
            Item item = invocation.getArgument(0);
            item.setId(itemId.getAndIncrement());
            savedItems.add(item);
            return item;
        });
        AtomicLong presentationId = new AtomicLong(1);
        when(presentationRepository.save(any(Presentation.class))).thenAnswer(invocation -> {
            Presentation presentation = invocation.getArgument(0);
            if (presentation.getId() == null) {
                presentation.setId(presentationId.getAndIncrement());
            }
            return presentation;
        });
        when(movimientoRepository.countByPresentationId(any(Long.class))).thenReturn(0L);
        when(movimientoRepository.save(any(Movimiento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        seeder.run();

        assertEquals(25, savedItems.size());
        ArgumentCaptor<Movimiento> movimientos = ArgumentCaptor.forClass(Movimiento.class);
        verify(movimientoRepository, org.mockito.Mockito.times(125)).save(movimientos.capture());

        for (int i = 0; i < savedItems.size(); i++) {
            Presentation presentation = savedItems.get(i).getPresentations().getFirst();
            assertEquals(50 + (i * 3), presentation.getStock());
            assertFalse(presentation.getEstimatedCost().signum() <= 0);
            assertEquals("SIGES-PRES-" + presentation.getId(), presentation.getQrCode());

            List<Movimiento> delInsumo = movimientos.getAllValues().stream()
                    .filter(movimiento -> movimiento.getPresentation().getId().equals(presentation.getId()))
                    .toList();
            assertEquals(5, delInsumo.size());
            int saldoCalculado = delInsumo.stream().mapToInt(movimiento -> switch (movimiento.getType()) {
                case "ENTRADA", "AJUSTE_POSITIVO" -> movimiento.getQuantity();
                case "SALIDA", "AJUSTE_NEGATIVO" -> -movimiento.getQuantity();
                default -> throw new IllegalStateException("Tipo de movimiento inesperado");
            }).sum();
            assertEquals(presentation.getStock(), saldoCalculado);
        }
    }

    @Test
    void mantieneLosDatosDemoDesactivadosPorDefecto() {
        seeder.run();

        verifyNoInteractions(itemRepository, presentationRepository, movimientoRepository);
    }

    private void setField(String name, Object value) throws ReflectiveOperationException {
        Field field = DataSeeder.class.getDeclaredField(name);
        field.setAccessible(true);
        field.set(seeder, value);
    }
}
