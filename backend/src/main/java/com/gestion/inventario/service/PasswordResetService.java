package com.gestion.inventario.service;

import com.gestion.inventario.model.PasswordResetToken;
import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.PasswordResetTokenRepository;
import com.gestion.inventario.repository.UsuarioRepository;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class PasswordResetService {

    private static final int CODIGO_LONGITUD = 6;
    private static final long EXPIRACION_MINUTOS = 10;
    private static final int MAX_INTENTOS_FALLIDOS = 5;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    private final SecureRandom random = new SecureRandom();

    /**
     * Solicita un código de recuperación para el email dado.
     * Respuesta genérica: no revela si el correo existe o no.
     */
    @Transactional
    public void solicitarRecuperacion(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String codigo = generarCodigo();
            invalidarTokensPrevios(usuario.getId());

            PasswordResetToken token = new PasswordResetToken();
            token.setUsuarioId(usuario.getId());
            token.setCodigoHash(passwordEncoder.encode(codigo));
            token.setExpiracion(LocalDateTime.now().plusMinutes(EXPIRACION_MINUTOS));
            token.setUsado(false);
            tokenRepository.save(token);

            enviarCorreoConCodigo(usuario, codigo);
        });
    }

    /**
     * Valida que el código sea correcto, no esté vencido ni usado.
     * Lanza excepción si no es válido; con límite de intentos fallidos.
     */
    @Transactional
    public void verificarCodigo(String email, String codigo) {
        validarCodigo(email, codigo);
    }

    /**
     * Valida el código y actualiza la contraseña del usuario.
     */
    @Transactional
    public void restablecer(String email, String codigo, String nuevaPassword) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Correo no registrado o código inválido"));

        PasswordResetToken token = validarCodigo(email, codigo);

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword));
        usuarioRepository.save(usuario);

        token.setUsado(true);
        tokenRepository.save(token);
    }

    private PasswordResetToken validarCodigo(String email, String codigo) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Correo no registrado o código inválido"));

        PasswordResetToken token = tokenRepository.findFirstByUsuarioIdOrderByIdDesc(usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("Correo no registrado o código inválido"));

        if (token.getUsado()) {
            throw new IllegalArgumentException("El código ya fue utilizado");
        }
        if (token.getExpiracion().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El código ha expirado. Solicita uno nuevo.");
        }
        if (token.getIntentosFallidos() >= MAX_INTENTOS_FALLIDOS) {
            throw new IllegalArgumentException("Demasiados intentos fallidos. Solicita un código nuevo.");
        }
        if (!passwordEncoder.matches(codigo, token.getCodigoHash())) {
            token.setIntentosFallidos(token.getIntentosFallidos() + 1);
            tokenRepository.save(token);
            throw new IllegalArgumentException("Código incorrecto");
        }
        return token;
    }

    private void invalidarTokensPrevios(Long usuarioId) {
        tokenRepository.findFirstByUsuarioIdOrderByIdDesc(usuarioId).ifPresent(token -> {
            token.setUsado(true);
            tokenRepository.save(token);
        });
    }

    private String generarCodigo() {
        return String.format("%0" + CODIGO_LONGITUD + "d", random.nextInt(1_000_000));
    }

    private void enviarCorreoConCodigo(Usuario usuario, String codigo) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(usuario.getEmail());
            helper.setSubject("SIGES - Código de recuperación de contraseña");
            helper.setText(
                    "Hola " + usuario.getNombre() + ",\n\n" +
                    "Tu código para restablecer tu contraseña es: " + codigo + "\n\n" +
                    "Este código es válido por " + EXPIRACION_MINUTOS + " minutos.\n" +
                    "Si no solicitaste este cambio, ignora este correo.\n\n" +
                    "Sistema SIGES - Gestión de Inventarios"
            );
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            throw new IllegalStateException("No se pudo enviar el código por correo. Inténtalo de nuevo.");
        }
    }
}
