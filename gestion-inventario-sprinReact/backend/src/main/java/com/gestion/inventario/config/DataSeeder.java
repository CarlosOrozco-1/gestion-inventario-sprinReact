package com.gestion.inventario.config;

import com.gestion.inventario.model.Insumo;
import com.gestion.inventario.model.Rol;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.InsumoRepository;
import com.gestion.inventario.repository.RolRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RolRepository rolRepository;
    private final UsuarioRepository usuarioRepository;
    private final InsumoRepository insumoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Asegurar que la columna codigo_qr exista en SQLite
        try {
            jdbcTemplate.execute("ALTER TABLE inventario_insumos ADD COLUMN codigo_qr TEXT;");
        } catch (Exception ignored) {
            // La columna ya existía en la base de datos
        }

        try {
            jdbcTemplate.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_insumos_codigo_qr ON inventario_insumos(codigo_qr);");
        } catch (Exception ignored) {
        }
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
        rolRepository.findByNombre("jefe")
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombre("jefe");
                    newRol.setNivel(50);
                    return rolRepository.save(newRol);
                });

        rolRepository.findByNombre("auxiliar")
                .orElseGet(() -> {
                    Rol newRol = new Rol();
                    newRol.setNombre("auxiliar");
                    newRol.setNivel(10);
                    return rolRepository.save(newRol);
                });

        // Asegurar que todos los insumos existentes en la BD tengan su código QR único
        for (Insumo ins : insumoRepository.findAll()) {
            if (ins.getCodigoQr() == null || ins.getCodigoQr().trim().isEmpty()) {
                String suffix = java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                ins.setCodigoQr("INS-QR-" + (ins.getNumero() != null ? ins.getNumero() : ins.getId()) + "-" + suffix);
                insumoRepository.save(ins);
            }
        }

        System.out.println("====== SEEDER EJECUTADO: Usuario Admin, Roles y Códigos QR de Insumos Verificados ======");
    }
}

