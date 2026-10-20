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

        Item item1 = new Item();
        item1.setName("Aire Comprimido");
        item1.setCode(1001);
        item1 = itemRepository.save(item1);

        Presentation p1 = new Presentation();
        p1.setItem(item1);
        p1.setName("Envase");
        p1.setSize("20 Onzas");
        p1.setStock(150);
        p1.setMinStock(20);
        p1.setMaxStock(200);
        p1.setActivo(true);
        p1.setQrCode("SIGES-PRES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p1 = presentationRepository.save(p1);
        p1.setQrCode("SIGES-PRES-" + p1.getId());
        presentationRepository.save(p1);

        Item item2 = new Item();
        item2.setName("Guantes Nitrilo");
        item2.setCode(1002);
        item2 = itemRepository.save(item2);

        Presentation p2 = new Presentation();
        p2.setItem(item2);
        p2.setName("Caja");
        p2.setSize("100 unidades");
        p2.setStock(80);
        p2.setMinStock(25);
        p2.setMaxStock(150);
        p2.setActivo(true);
        p2.setQrCode("SIGES-PRES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p2 = presentationRepository.save(p2);
        p2.setQrCode("SIGES-PRES-" + p2.getId());
        presentationRepository.save(p2);

        Item item3 = new Item();
        item3.setName("Alcohol Isopropílico");
        item3.setCode(1003);
        item3 = itemRepository.save(item3);

        Presentation p3 = new Presentation();
        p3.setItem(item3);
        p3.setName("Botella");
        p3.setSize("1 Litro");
        p3.setStock(60);
        p3.setMinStock(15);
        p3.setMaxStock(100);
        p3.setActivo(true);
        p3.setQrCode("SIGES-PRES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p3 = presentationRepository.save(p3);
        p3.setQrCode("SIGES-PRES-" + p3.getId());
        presentationRepository.save(p3);

        Item item4 = new Item();
        item4.setName("Trapos Industriales");
        item4.setCode(1004);
        item4 = itemRepository.save(item4);

        Presentation p4 = new Presentation();
        p4.setItem(item4);
        p4.setName("Paquete");
        p4.setSize("25 unidades");
        p4.setStock(40);
        p4.setMinStock(10);
        p4.setMaxStock(80);
        p4.setActivo(true);
        p4.setQrCode("SIGES-PRES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p4 = presentationRepository.save(p4);
        p4.setQrCode("SIGES-PRES-" + p4.getId());
        presentationRepository.save(p4);

        Item item5 = new Item();
        item5.setName("Desengrasante");
        item5.setCode(1005);
        item5 = itemRepository.save(item5);

        Presentation p5 = new Presentation();
        p5.setItem(item5);
        p5.setName("Galón");
        p5.setSize("1 Galón");
        p5.setStock(35);
        p5.setMinStock(8);
        p5.setMaxStock(60);
        p5.setActivo(true);
        p5.setQrCode("SIGES-PRES-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        p5 = presentationRepository.save(p5);
        p5.setQrCode("SIGES-PRES-" + p5.getId());
        presentationRepository.save(p5);

        crearMovimiento(p1, MovimientoTipo.ENTRADA, 200, "Ingreso inicial de stock", admin);
        crearMovimiento(p1, MovimientoTipo.SALIDA, 30, "Consumo para mantenimiento preventivo", admin);
        crearMovimiento(p1, MovimientoTipo.SALIDA, 20, "Salida a taller mecánico", admin);
        crearMovimiento(p2, MovimientoTipo.ENTRADA, 100, "Compra mensual guantes nitrilo", admin);
        crearMovimiento(p2, MovimientoTipo.SALIDA, 20, "Entrega a cuadrilla de trabajo", admin);
        crearMovimiento(p3, MovimientoTipo.ENTRADA, 80, "Compra de insumos de limpieza", admin);
        crearMovimiento(p3, MovimientoTipo.SALIDA, 15, "Uso en área de producción", admin);
        crearMovimiento(p4, MovimientoTipo.ENTRADA, 50, "Ingreso de trapos industriales", admin);
        crearMovimiento(p4, MovimientoTipo.SALIDA, 10, "Uso diario taller", admin);
        crearMovimiento(p5, MovimientoTipo.ENTRADA, 40, "Compra de desengrasante", admin);
        crearMovimiento(p5, MovimientoTipo.SALIDA, 5, "Aplicación en equipos", admin);
        crearMovimiento(p1, MovimientoTipo.AJUSTE_POSITIVO, 5, "Conteo físico ajustado por sobrante en inventario tras revisión", admin);
        crearMovimiento(p3, MovimientoTipo.AJUSTE_NEGATIVO, 3, "Merma por derrame justificado y documentado en acta", admin);
        crearMovimiento(p2, MovimientoTipo.AJUSTE_POSITIVO, 2, "Corrección por diferencia de conteo físico", admin);
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
