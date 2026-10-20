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

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

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

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        rolRepository.findByName("admin").ifPresent(rolLegacy -> {
            rolLegacy.setName("ADMIN");
            rolRepository.save(rolLegacy);
        });

        seedRol("ADMIN", 100, "Acceso total al sistema");
        seedRol("JEFE", 80, "Autoriza salidas e ingresos");
        seedRol("AUXILIAR", 50, "Solo consulta de insumos");

        seedAdmin();
        seedCatalogoYMovimientos();
    }

    private void seedAdmin() {
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        String password = adminPassword == null ? "" : adminPassword;

        if (email.isEmpty() || password.isEmpty()) {
            System.out.println("====== SEEDER: ADMIN_EMAIL/ADMIN_PASSWORD no definidos; no se crea admin por defecto ======");
            return;
        }

        Rol adminRol = rolRepository.findByName("ADMIN")
                .orElseThrow(() -> new RuntimeException("Rol ADMIN no encontrado"));

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
        if (itemRepository.count() > 0) {
            return;
        }

        Usuario admin = usuarioRepository.findAll().stream().findFirst().orElse(null);

        String[][] items = {
            {"Aire Comprimido", "20 Onzas"}, {"Guantes Nitrilo", "100 unidades"}, {"Alcohol Isopropílico", "1 Litro"},
            {"Trapos Industriales", "25 unidades"}, {"Desengrasante", "1 Galón"}, {"Lubricante Multiuso", "400 ml"},
            {"Cinta de Aislamiento", "Rollo"}, {"Gafas de Seguridad", "Par"}, {"Mascarillas N95", "Caja 20"},
            {"Jeringas", "Paquete 100"}, {"Guantes Látex", "Caja 100"}, {"Cloro", "1 Galón"},
            {"Detergente Neutro", "5 Litros"}, {"Cepillos", "Unidad"}, {"Esponjas", "Paquete 10"},
            {"Cinta Adhesiva", "Rollo"}, {"Brochas", "Unidad"}, {"Thinner", "1 Galón"},
            {"Filtros de Aire", "Unidad"}, {"Grasa Industrial", "Tubo 500g"}, {"Algodón", "Kilo"},
            {"Gasolina Blanca", "Galón"}, {"Líquido Refrigerante", "Galón"}, {"Silicona", "Tubo"},
            {"Toallas Absorbentes", "Rollo 200"}
        };

        for (int i = 0; i < items.length; i++) {
            String nombre = items[i][0];
            String size = items[i][1];
            int code = 1001 + i;
            Item item = new Item();
            item.setName(nombre);
            item.setCode(code);
            item = itemRepository.save(item);

            Presentation p = new Presentation();
            p.setItem(item);
            p.setName("Presentación");
            p.setSize(size);
            p.setStock(50 + (i * 3));
            p.setMinStock(5 + i);
            p.setMaxStock(150 + (i * 5));
            p.setActivo(true);
            p.setQrCode("SIGES-PRES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            p = presentationRepository.save(p);
            p.setQrCode("SIGES-PRES-" + p.getId());
            presentationRepository.save(p);

            if (admin != null) {
                crearMovimiento(p, MovimientoTipo.ENTRADA, 120, "Ingreso inicial - " + nombre, admin);
                crearMovimiento(p, MovimientoTipo.ENTRADA, 40, "Reposición - " + nombre, admin);
                crearMovimiento(p, MovimientoTipo.SALIDA, 15, "Consumo operativo - " + nombre, admin);
                crearMovimiento(p, MovimientoTipo.SALIDA, 10, "Salida a taller - " + nombre, admin);
                if (i % 3 == 0) crearMovimiento(p, MovimientoTipo.SALIDA, 5, "Entrega interna - " + nombre, admin);
                if (i % 4 == 0) crearMovimiento(p, MovimientoTipo.AJUSTE_POSITIVO, 3, "Ajuste positivo por conteo - " + nombre, admin);
                if (i % 5 == 0) crearMovimiento(p, MovimientoTipo.AJUSTE_NEGATIVO, 2, "Merma justificada - " + nombre, admin);
            }
        }
    }

    private void crearMovimiento(Presentation presentation, MovimientoTipo tipo, Integer cantidad, String detalle, Usuario usuario) {
        if (cantidad == null || cantidad <= 0) return;
        if (usuario == null) return;
        switch (tipo) {
            case ENTRADA, AJUSTE_POSITIVO -> presentation.setStock(presentation.getStock() + cantidad);
            case SALIDA, AJUSTE_NEGATIVO -> {
                if (cantidad > presentation.getStock()) return;
                presentation.setStock(presentation.getStock() - cantidad);
            }
        }
        presentationRepository.save(presentation);
        Movimiento m = new Movimiento();
        m.setPresentation(presentation);
        m.setType(tipo.name());
        m.setQuantity(cantidad);
        m.setDetail(detalle);
        m.setUsuario(usuario);
        LocalDateTime ahora = LocalDateTime.now();
        m.setMonth(ahora.getMonthValue());
        m.setYear(ahora.getYear());
        movimientoRepository.save(m);
    }
}
