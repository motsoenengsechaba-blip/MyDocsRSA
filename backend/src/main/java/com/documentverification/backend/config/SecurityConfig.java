package com.documentverification.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.documentverification.backend.security.JwtAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    /**

     * Creates the BCrypt password encoder used to protect MyDocs RSA user passwords in the database.

     */

    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    /**

     * Configures which MyDocs RSA API routes are public, which require JWT authentication and which roles can access protected police/admin operations.

     */

    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                // Missing/expired token -> 401 (so the app can log out). Wrong role -> 403.
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/test-email").hasRole("ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        // Review actions: officers only (the admin monitors, it does not verify)
                        .requestMatchers("/api/certification/requests/pending", "/api/certification/requests/in-review", "/api/certification/requests/*/review", "/api/certification/requests/*/approve", "/api/certification/requests/*/reject", "/api/certification/requests/*/more-information").hasRole("POLICE_OFFICER")
                        .requestMatchers("/api/verification/**", "/api/certification/verify/**").hasAnyRole("ADMIN", "POLICE_OFFICER")
                        .requestMatchers("/api/documents/upload", "/api/documents/resubmit", "/api/certification/requests", "/api/certification/requests/me", "/api/certification/requests/*/resubmit", "/api/certification/credentials/me", "/api/certification/credentials/*", "/api/credentials/*/request").hasRole("USER")
                        .requestMatchers("/api/documents/user/**", "/api/documents/*/history", "/api/documents/*/download", "/api/documents/*")
                            .hasAnyRole("USER", "ADMIN", "POLICE_OFFICER")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Lets the Expo web version (a browser on another port) call the API.
    // Phones/emulators do not need CORS. Restrict the origins before going to production.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}