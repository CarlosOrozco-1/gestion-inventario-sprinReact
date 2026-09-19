package com.gestion.inventario.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Orígenes de dev (Vite en cualquier puerto local) y el dominio de
        // producción servido por nginx (:8081) / Caddy.
        registry.addMapping("/**")
                .allowedOriginPatterns("http://localhost:*", "https://localhost:*", "https://gestioninventario.duckdns.org")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
