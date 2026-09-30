package com.gestion.inventario.config;

import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Credenciales del usuario administrador inicial, leídas del .env
     * (ADMIN_EMAIL / ADMIN_PASSWORD). Ya NO existen credenciales predeterminadas
     * hardcodeadas: si estas variables no están definidas, no se crea ningún
     * administrador al arrancar.
     */
    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        // Normalizamos el rol legado "admin" (minúsculas) a "ADMIN"
        rolRepository.findByName("admin").ifPresent(rolLegacy -> {
            rolLegacy.setName("ADMIN");
            rolRepository.save(rolLegacy);
        });

        seedRol("ADMIN", 100, "Acceso total al sistema");
        seedRol("JEFE", 80, "Autoriza salidas e ingresos");
        seedRol("AUXILIAR", 50, "Solo consulta de insumos");

        seedAdmin();
    }

    /**
     * Crea o sincroniza el usuario administrador con base en el .env, que es la
     * fuente de verdad (cada arranque resincroniza su contraseña). Si no se
     * definieron ADMIN_EMAIL/ADMIN_PASSWORD, no se genera ningún admin.
     */
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
}
