package com.nexus.nexusbackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Clerk config — reads auth settings from environment variables via Spring's
 * relaxed binding (exactly the same pattern as VapidConfig):
 *
 *   CLERK_JWKS_URL (env var) → "clerk.jwks-url" (Spring property) → jwksUrl field
 *
 * WHAT IS THE JWKS URL?
 *   Clerk signs the JWTs it issues (session tokens) with a private RSA key and
 *   publishes the matching PUBLIC key at a well-known endpoint:
 *
 *     https://<your-instance>.clerk.accounts.dev/.well-known/jwks.json
 *
 *   Anyone (including our backend) can fetch that public key and use it to
 *   verify that a JWT really was signed by Clerk. You confirmed this endpooint
 *   works yourself: pasting the URL in the browser returned the raw signing key
 *   — an RS256 RSA key with a "kid".
 *
 * WHY IS THE ISSUER DERIVED AND NOT A SECOND ENV VAR?
 *   A token's "iss" (issuer) claim is always the Clerk instance domain — the
 *   SAME domain the JWKS URL sits on. Deriving it keeps the config at ONE env
 *   var and guarantees the two can never drift out of sync.
 */
@Data
@Component
@ConfigurationProperties(prefix = "clerk")
public class ClerkConfig {

    /**
     * The Clerk instance's public-key endpoint.
     * REQUIRED — the server refuses to start without it (fail-closed, see ClerkJwtVerifier).
     * Example: https://sharp-midge-68.clerk.accounts.dev/.well-known/jwks.json
     */
    private String jwksUrl;

    /**
     * The expected "iss" claim — hand-written getter (no field), computed from
     * the JWKS URL because both live on the same Clerk instance domain:
     *
     *   https://instance.clerk.accounts.dev/.well-known/jwks.json
     *     → https://instance.clerk.accounts.dev
     *
     * (Lombok's @Data is fine sharing the class with this: it only generates
     * getters for real fields, and issuer has no field.)
     */
    public String getIssuer() {
        return jwksUrl.replace("/.well-known/jwks.json", "");
    }
}