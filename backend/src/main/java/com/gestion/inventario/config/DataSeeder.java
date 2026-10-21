package com.gestion.inventario.config;

import com.gestion.inventario.model.Item;
import com.gestion.inventario.model.Movimiento;
import com.gestion.inventario.model.MovimientoTipo;
import com.gestion.inventario.model.Presentation;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.ItemRepository;
import com.gestion.inventario.repository.MovimientoRepository;
import com.gestion.inventario.repository.PresentationRepository;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String[][] CATALOGO = {
        {"Aire Comprimido", "20 Onzas", "5", "150", "10.00"},
        {"Guantes Nitrilo", "100 unidades", "6", "155", "12.50"},
        {"Alcohol Isopropílico", "1 Litro", "7", "160", "15.00"},
        {"Trapos Industriales", "25 unidades", "8", "165", "17.50"},
        {"Desengrasante", "1 Galón", "9", "170", "20.00"},
        {"Lubricante Multiuso", "400 ml", "10", "175", "22.50"},
        {"Cinta de Aislamiento", "Rollo", "11", "180", "25.00"},
        {"Gafas de Seguridad", "Par", "12", "185", "27.50"},
        {"Mascarillas N95", "Caja 20", "13", "190", "30.00"},
        {"Jeringas", "Paquete 100", "14", "195", "32.50"},
        {"Guantes Látex", "Caja 100", "15", "200", "35.00"},
        {"Cloro", "1 Galón", "16", "205", "37.50"},
        {"Detergente Neutro", "5 Litros", "17", "210", "40.00"},
        {"Cepillos", "Unidad", "18", "215", "42.50"},
        {"Esponjas", "Paquete 10", "19", "220", "45.00"},
        {"Cinta Adhesiva", "Rollo", "20", "225", "47.50"},
        {"Brochas", "Unidad", "21", "230", "50.00"},
        {"Thinner", "1 Galón", "22", "235", "52.50"},
        {"Filtros de Aire", "Unidad", "23", "240", "55.00"},
        {"Grasa Industrial", "Tubo 500g", "24", "245", "57.50"},
        {"Algodón", "Kilo", "25", "250", "60.00"},
        {"Gasolina Blanca", "Galón", "26", "255", "62.50"},
        {"Líquido Refrigerante", "Galón", "27", "260", "65.00"},
        {"Silicona", "Tubo", "28", "265", "67.50"},
        {"Toallas Absorbentes", "Rollo 200", "29", "270", "70.00"}
    };

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final ItemRepository itemRepository;
    private final PresentationRepository presentationRepository;
    private final MovimientoRepository movimientoRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.seed.demo-data:false}")
    private boolean demoDataEnabled;

    @Override
    @Transactional
    public void run(String... args) {
        rolRepository.findByName("admin").ifPresent(rolLegacy -> {
            rolLegacy.setName("ADMIN");
            rolRepository.save(rolLegacy);
        });

        seedRol("ADMIN", 100, "Acceso total al sistema");
        seedRol("JEFE", 80, "Autoriza salidas e ingresos");
        seedRol("AUXILIAR", 50, "Solo consulta de insumos");

        seedAdmin();
        if (demoDataEnabled) {
            seedCatalogoYMovimientos();
        } else {
            System.out.println("====== SEEDER: datos demo desactivados (app.seed.demo-data=false) ======");
        }
    }

    private void seedAdmin() {
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        String password = adminPassword == null ? "" : adminPassword;

        if (email.isEmpty() || password.isEmpty()) {
            System.out.println("====== SEEDER: ADMIN_EMAIL/ADMIN_PASSWORD no definidos; no se crea admin por defecto ======");
            return;
        }

        Rol adminRol = rolRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("Rol ADMIN no encontrado"));

        usuarioRepository.findByEmail(email).ifPresentOrElse(existing -> {
            if (!passwordEncoder.matches(password, existing.getPasswordHash())) {
                existing.setPasswordHash(passwordEncoder.encode(password));
                existing.setRol(adminRol);
                usuarioRepository.save(existing);
                System.out.println("====== SEEDER: contraseña del admin sincronizada desde .env ======");
            }
        }, () -> {
            Usuario adminUser = new Usuario();
            adminUser.setName("Administrador");
            adminUser.setEmail(email);
            adminUser.setPasswordHash(passwordEncoder.encode(password));
            adminUser.setRol(adminRol);
            usuarioRepository.save(adminUser);
            System.out.println("====== SEEDER: Usuario Admin creado desde .env (" + email + ") ======");
        });
    }

    private void seedRol(String nombre, int nivel, String descripcion) {
        if (rolRepository.findByName(nombre).isEmpty()) {
            Rol rol = new Rol();
            rol.setName(nombre);
            rol.setLevel(nivel);
            rol.setDescription(descripcion);
            rolRepository.save(rol);
        }
    }

    private void seedCatalogoYMovimientos() {
        List<Item> items = new ArrayList<>(itemRepository.findAll());
        List<Presentation> presentaciones = new ArrayList<>();

        for (int i = 0; i < CATALOGO.length; i++) {
            String[] datos = CATALOGO[i];
            int codigo = 1001 + i;
            String nombre = datos[0];
            String tamano = datos[1];

            Item item = items.stream()
                    .filter(actual -> actual.getCode().equals(codigo) || actual.getName().equalsIgnoreCase(nombre))
                    .findFirst()
                    .orElseGet(() -> {
                        Item nuevo = new Item();
                        nuevo.setCode(codigo);
                        nuevo.setName(nombre);
                        Item guardado = itemRepository.save(nuevo);
                        items.add(guardado);
                        return guardado;
                    });

            Presentation presentation = item.getPresentations().stream()
                    .filter(actual -> actual.getSize().equalsIgnoreCase(tamano))
                    .findFirst()
                    .orElseGet(() -> {
                        Presentation nueva = new Presentation();
                        nueva.setItem(item);
                        nueva.setName("Presentación");
                        nueva.setSize(tamano);
                        nueva.setMinStock(Integer.valueOf(datos[2]));
                        nueva.setMaxStock(Integer.valueOf(datos[3]));
                        nueva.setStock(0);
                        nueva.setActivo(true);
                        item.addPresentation(nueva);
                        return presentationRepository.save(nueva);
                    });

            if (presentation.getMinStock() == null) {
                presentation.setMinStock(Integer.valueOf(datos[2]));
            }
            if (presentation.getMaxStock() == null) {
                presentation.setMaxStock(Integer.valueOf(datos[3]));
            }
            if (presentation.getEstimatedCost() == null || presentation.getEstimatedCost().signum() == 0) {
                presentation.setEstimatedCost(new BigDecimal(datos[4]));
            }
            if (presentation.getQrCode() == null || !presentation.getQrCode().equals("SIGES-PRES-" + presentation.getId())) {
                presentation.setQrCode("SIGES-PRES-" + presentation.getId());
            }
            presentation = presentationRepository.save(presentation);
            presentaciones.add(presentation);
        }

        Usuario admin = usuarioRepository.findAll().stream()
                .filter(usuario -> usuario.getRol() != null && "ADMIN".equals(usuario.getRol().getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "No se pueden sembrar movimientos demo sin un usuario ADMIN. Configura ADMIN_EMAIL y ADMIN_PASSWORD."));

        for (int i = 0; i < presentaciones.size(); i++) {
            Presentation presentation = presentaciones.get(i);
            if (movimientoRepository.countByPresentationId(presentation.getId()) > 0) {
                continue;
            }
            seedMovimientosDemo(presentation, admin, i);
        }
    }

    private void seedMovimientosDemo(Presentation presentation, Usuario admin, int index) {
        int stockActual = presentation.getStock();

        if (stockActual > 0) {
            crearMovimiento(presentation, MovimientoTipo.ENTRADA, stockActual,
                    "DEMO: saldo inicial del catálogo para completar el historial.", admin, false);
            int cantidadEquilibrio = Math.min(stockActual, 10);
            crearMovimiento(presentation, MovimientoTipo.SALIDA, cantidadEquilibrio,
                    "DEMO: consumo de prueba del inventario.", admin, true);
            crearMovimiento(presentation, MovimientoTipo.ENTRADA, cantidadEquilibrio,
                    "DEMO: reposición de prueba del inventario.", admin, true);
        } else {
            int stockObjetivo = 50 + (index * 3);
            crearMovimiento(presentation, MovimientoTipo.ENTRADA, stockObjetivo + 15,
                    "DEMO: ingreso inicial de prueba del catálogo.", admin, true);
            crearMovimiento(presentation, MovimientoTipo.SALIDA, 10,
                    "DEMO: consumo de prueba del inventario.", admin, true);
            crearMovimiento(presentation, MovimientoTipo.SALIDA, 5,
                    "DEMO: entrega de prueba para operaciones.", admin, true);
        }

        crearMovimiento(presentation, MovimientoTipo.AJUSTE_POSITIVO, 3,
                "DEMO: sobrante detectado en conteo físico de prueba.", admin, true);
        crearMovimiento(presentation, MovimientoTipo.AJUSTE_NEGATIVO, 3,
                "DEMO: merma documentada durante conteo de prueba.", admin, true);
    }

    private void crearMovimiento(Presentation presentation, MovimientoTipo tipo, Integer cantidad,
                                 String detalle, Usuario usuario, boolean actualizarStock) {
        if (cantidad == null || cantidad <= 0) {
            throw new IllegalArgumentException("La cantidad de un movimiento demo debe ser positiva.");
        }

        if (actualizarStock) {
            switch (tipo) {
                case ENTRADA, AJUSTE_POSITIVO -> presentation.setStock(presentation.getStock() + cantidad);
                case SALIDA, AJUSTE_NEGATIVO -> {
                    if (cantidad > presentation.getStock()) {
                        throw new IllegalStateException("El seeder intentó generar stock negativo.");
                    }
                    presentation.setStock(presentation.getStock() - cantidad);
                }
            }
            presentationRepository.save(presentation);
        }

        Movimiento movimiento = new Movimiento();
        movimiento.setPresentation(presentation);
        movimiento.setType(tipo.name());
        movimiento.setQuantity(cantidad);
        movimiento.setDetail(detalle);
        movimiento.setUsuario(usuario);
        LocalDateTime ahora = LocalDateTime.now();
        movimiento.setMonth(ahora.getMonthValue());
        movimiento.setYear(ahora.getYear());
        movimientoRepository.save(movimiento);
    }
}
