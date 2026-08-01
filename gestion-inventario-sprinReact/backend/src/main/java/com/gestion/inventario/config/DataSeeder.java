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

        if (insumoRepository.count() == 0) {
            Insumo insumo1 = new Insumo();
            insumo1.setNumero(101);
            insumo1.setInsumo("Papel Bond A4");
            insumo1.setPresentacion("Paquete");
            insumo1.setTamanoPresentacion("500 hojas");
            insumo1.setStock(50);
            insumo1.setEntrada(50);
            insumoRepository.save(insumo1);

            Insumo insumo2 = new Insumo();
            insumo2.setNumero(102);
            insumo2.setInsumo("Tinta Negra HP");
            insumo2.setPresentacion("Cartucho");
            insumo2.setTamanoPresentacion("2 ml");
            insumo2.setStock(5);
            insumo2.setEntrada(10);
            insumoRepository.save(insumo2);
        }
        
        System.out.println("====== SEEDER EJECUTADO: Usuario Admin y Datos de Prueba Cargados ======");
    }
}

