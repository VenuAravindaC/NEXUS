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
        // Read allowed origins from environment variable (comma-separated for multiple).
        // Falls back to localhost:5173 for local dev when the env var isn't set.
        //
        // WHY ENV VAR? In production the frontend lives on a different domain
        // (e.g. Vercel). Hardcoding localhost:5173 would block all live requests.
        // The CORS_ALLOWED_ORIGINS env var is set in docker-compose.yml, Render,
        // or wherever this backend runs.
        //
        // WHY NOT "*"?
        // When allowCredentials(true) is set (needed for Authorization header),
        // the browser REJECTS a wildcard origin — it's a security feature.
        String origins = System.getenv("CORS_ALLOWED_ORIGINS");
        if (origins == null || origins.isBlank()) {
            origins = "http://localhost:5173"; // dev fallback
        }

        registry.addMapping("/api/**")
                .allowedOrigins(origins.split(","))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type")
                .allowCredentials(true);
    }
}