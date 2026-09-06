package com.nexus.nexusbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Central CORS configuration — replaces the two @CrossOrigin(origins = "*")
 * annotations that used to sit on ReminderController and PushSubscriptionController.
 *
 * WHY CENTRALIZE? Two controllers were about to need the SAME origin allow-list.
 * One place that names the allowed frontend origin beats two copies of a TODO.
 *
 * WHY AN EXACT ORIGIN, NOT "*"?
 *   The browser sends the Authorization header (a credential) on real requests,
 *   and the backend must reply with matching credential headers. Once credentials
 *   are involved, the browser LEGALLY REFUSES a wildcard — "*" is rejected.
 *   That is a security feature: it stops any random website from hijacking a
 *   logged-in session.
 *
 *   → Add your real deploy origin here when the frontend goes live on Vercel,
 *     e.g. "https://cue.vercel.app".
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173") // ← must match Vite's dev port
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .allowCredentials(true);
    }
}