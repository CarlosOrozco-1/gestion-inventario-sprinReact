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
        if (rolRepository.count() == 0) {
            Rol adminRol = new Rol();
            adminRol.setNombre("admin");
            adminRol.setNivel(100);
            rolRepository.save(adminRol);

            Usuario adminUser = new Usuario();
            adminUser.setNombre("Administrador");
            adminUser.setEmail("admin@inventario.com");
            adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
            adminUser.setRol(adminRol);
            usuarioRepository.save(adminUser);
            
            System.out.println("====== SEEDER EJECUTADO: Usuario Admin Creado (ID: 1) ======");
        }
    }
}
