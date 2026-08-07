package com.gestion.inventario.config;

import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

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

        if (usuarioRepository.findByEmail("admin@inventario.com").isEmpty()) {
            Rol adminRol = rolRepository.findByName("ADMIN")
                    .orElseThrow(() -> new RuntimeException("Rol ADMIN no encontrado"));

            Usuario adminUser = new Usuario();
            adminUser.setName("Administrador");
            adminUser.setEmail("admin@inventario.com");
            adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
            adminUser.setRol(adminRol);
            usuarioRepository.save(adminUser);

            System.out.println("====== SEEDER EJECUTADO: Usuario Admin Creado (ID: 1) ======");
        }
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
