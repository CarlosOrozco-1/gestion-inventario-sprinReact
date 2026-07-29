package com.gestion.inventario.security;

import com.gestion.inventario.model.Usuario;
import com.gestion.inventario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + email));
        
        // Convertimos nuestro usuario de BD a un usuario de Spring Security
        return new User(
                usuario.getEmail(),
                usuario.getPasswordHash(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().getNombre().toUpperCase()))
        );
    }
}
