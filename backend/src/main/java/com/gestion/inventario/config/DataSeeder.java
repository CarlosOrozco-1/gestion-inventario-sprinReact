package com.gestion.inventario.config;

import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    public void run(String... args) throws Exception {
        if (rolRepository.count() == 0) {
            Rol adminRol = new Rol();
            adminRol.setNombre("ADMIN");
            adminRol.setNivel(100);
            adminRol.setDescripcion("Administrador del sistema");
            adminRol = rolRepository.save(adminRol);

            Usuario adminUser = new Usuario();
            adminUser.setNombre("Carlos Orozco");
            adminUser.setEmail("admin@inventario.com");
            adminUser.setPasswordHash("hash_temporal");
            adminUser.setRol(adminRol);
            usuarioRepository.save(adminUser);
            
            System.out.println("====== SEEDER EJECUTADO: Usuario Admin Creado (ID: 1) ======");
        }
    }
}
