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
            token.setCodeHash(passwordEncoder.encode(codigo));
            token.setExpiresAt(LocalDateTime.now().plusMinutes(EXPIRACION_MINUTOS));
            token.setUsed(false);
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

        token.setUsed(true);
        tokenRepository.save(token);
    }

    private PasswordResetToken validarCodigo(String email, String codigo) {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Correo no registrado o código inválido"));

        PasswordResetToken token = tokenRepository.findFirstByUsuarioIdOrderByIdDesc(usuario.getId())
                .orElseThrow(() -> new IllegalArgumentException("Correo no registrado o código inválido"));

        if (token.getUsed()) {
            throw new IllegalArgumentException("El código ya fue utilizado");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("El código ha expirado. Solicita uno nuevo.");
        }
        if (token.getFailedAttempts() >= MAX_INTENTOS_FALLIDOS) {
            throw new IllegalArgumentException("Demasiados intentos fallidos. Solicita un código nuevo.");
        }
        if (!passwordEncoder.matches(codigo, token.getCodeHash())) {
            token.setFailedAttempts(token.getFailedAttempts() + 1);
            tokenRepository.save(token);
            throw new IllegalArgumentException("Código incorrecto");
        }
        return token;
    }

    private void invalidarTokensPrevios(Long usuarioId) {
        tokenRepository.findFirstByUsuarioIdOrderByIdDesc(usuarioId).ifPresent(token -> {
            token.setUsed(true);
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
            helper.setText(textoPlano(usuario, codigo), htmlCorreo(usuario, codigo));
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            throw new IllegalStateException("No se pudo enviar el código por correo. Inténtalo de nuevo.");
        }
    }

    private String textoPlano(Usuario usuario, String codigo) {
        return "Hola " + usuario.getName() + ",\n\n" +
                "Tu código para restablecer tu contraseña es: " + codigo + "\n\n" +
                "Este código es válido por " + EXPIRACION_MINUTOS + " minutos.\n" +
                "Si no solicitaste este cambio, ignora este correo.\n\n" +
                "Sistema SIGES - Gestión de Inventarios";
    }

    private String htmlCorreo(Usuario usuario, String codigo) {
        String html = """
                <!DOCTYPE html>
                <html lang="es">
                <body style="margin:0;padding:0;background-color:#eef2f9;font-family:Arial,Helvetica,sans-serif;">
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color:#eef2f9;padding:32px 16px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#2563eb,#1e3a8a);padding:32px 40px;text-align:center;">
                            <div style="font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">SIGES</div>
                            <div style="font-size:14px;color:#dbeafe;margin-top:6px;">Recuperaci&oacute;n de contrase&ntilde;a</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:36px 40px 12px;">
                            <p style="margin:0 0 14px;color:#111827;font-size:16px;line-height:1.6;">Hola %s,</p>
                            <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;">Recibimos una solicitud para restablecer la contrase&ntilde;a de tu cuenta. Usa el siguiente c&oacute;digo para continuar:</p>
                            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                              <tr>
                                <td align="center" style="background-color:#eff6ff;border:2px dashed #2563eb;border-radius:12px;padding:20px;">
                                  <div style="font-size:36px;font-weight:bold;color:#2563eb;letter-spacing:10px;font-family:Consolas,Menlo,monospace;">%s</div>
                                </td>
                              </tr>
                            </table>
                            <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">Este c&oacute;digo es v&aacute;lido por <strong>%d minutos</strong> y solo puede usarse una vez.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px 40px 36px;text-align:center;">
                            <div style="height:1px;background-color:#e5e7eb;margin-bottom:20px;"></div>
                            <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
                            <p style="margin:12px 0 0;color:#6b7280;font-size:12px;">&copy; 2026 SIGES &mdash; Sistema de Gesti&oacute;n de Inventarios</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                </body>
                </html>
                """.formatted(usuario.getName(), codigo, EXPIRACION_MINUTOS);
        return html;
    }
}
