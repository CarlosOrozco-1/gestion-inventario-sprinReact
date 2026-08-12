package com.gestion.inventario.config;

import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.InsumoRepository;
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
    private final InsumoRepository insumoRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Rol adminRol = rolRepository.findByNombre("admin")
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombre("admin");
                    newRol.setNivel(100);
                    return rolRepository.save(newRol);
                });

        Usuario adminUser = usuarioRepository.findByEmail("admin@inventario.com")
                .orElseGet(() -> {
                    Usuario newUser = new Usuario();
                    newUser.setEmail("admin@inventario.com");
                    newUser.setNombre("Administrador");
                    newUser.setRol(adminRol);
                    return newUser;
                });

        // Aseguramos que la contraseña esté hasheada con BCrypt
        adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
        usuarioRepository.save(adminUser);

        // Crear roles por defecto si no existen
        Rol jefeRol = rolRepository.findByNombre("jefe")
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombre("jefe");
                    newRol.setNivel(50);
                    return rolRepository.save(newRol);
                });

        Rol auxRol = rolRepository.findByNombre("auxiliar")
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombre("auxiliar");
                    newRol.setNivel(10);
                    return rolRepository.save(newRol);
                });

        System.out.println("====== SEEDER EJECUTADO: Usuario Admin y Roles Cargados ======");
    }
}

