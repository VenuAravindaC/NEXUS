package com.nexus.nexusbackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Reads the VAPID keys from environment variables using Spring's relaxed binding:
 *   VAPID_PUBLIC_KEY  → publicKey
 *   VAPID_PRIVATE_KEY → privateKey
 *   VAPID_SUBJECT     → subject (optional, defaults to mailto:...)
 *
 * Why @ConfigurationProperties instead of @Value on every injection?
 *   All push configuration lives in ONE place, ONE class — easy to test,
 *   easy to change later, and the @Component + @Data gives us a clean
 *   Java bean with getters. The scheduler's WebPushSender reads from this
 *   bean; it never touches env vars directly.
 *
 * Spring relaxed binding works like this:
 *   VAPID_PUBLIC_KEY (env var) → "vapid.public-key" (Spring property)
 *                                → public-key (kebab-case to camelCase → publicKey)
 *   This is why Java convention says the field is `publicKey` but the
 *   env var is `VAPID_PUBLIC_KEY` — Spring handles the mapping automatically.
 */
@Data
@Component
@ConfigurationProperties(prefix = "vapid")
public class VapidConfig {

    private String publicKey;
    private String privateKey;

    /**
     * The "mailto:" URL identifies your app to the push provider.
     * Safari requires a mailto: scheme (not https://localhost).
     */
    private String subject = "mailto:admin@nexus-app.com";
}