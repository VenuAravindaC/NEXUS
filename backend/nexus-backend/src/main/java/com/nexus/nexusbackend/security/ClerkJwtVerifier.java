package com.nexus.nexusbackend.security;

import com.nexus.nexusbackend.config.ClerkConfig;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jose4j.jwk.HttpsJwks;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.MalformedClaimException;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.resolvers.HttpsJwksVerificationKeyResolver;
import org.springframework.stereotype.Component;

/**
 * The deep module behind the auth filter. One public method:
 *
 *     verifyAndGetUserId(token) → the Clerk user id (the JWT's "sub" claim)
 *
 * ALL JWT cryptography lives here, not in AuthFilter. The filter handles HTTP
 * plumbing (pulling the header, writing the 401) and delegates the crypto to
 * this class — two separate seams, each small, and the verifier is testable
 * without a servlet container.
 *
 * HOW VERIFICATION WORKS — the steps behind a JWT:
 *
 *   1. PUBLIC KEYS: on first use, fetch Clerk's public signing key(s) from the
 *      JWKS URL ({@link HttpsJwks}). jose4j caches them and refreshes when a
 *      token's "kid" isn't found. This is the same key you saw in the browser.
 *
 *   2. SIGNATURE: recompute the signature from the token's header.payload and
 *      the public key, and check it matches the signature in the token. Only
 *      someone holding Clerk's PRIVATE key could have produced it → the token
 *      is genuinely Clerk-issued and untampered.
 *
 *   3. CLAIMS: enforce the rules set in {@link #init()}:
 *        - "iss" must be our Clerk instance  (another instance's tokens fail)
 *        - "exp" must exist and be in the future  (not expired)
 *        - "sub" must exist  (a token with no user id is meaningless)
 *
 *   4. RESULT: the "sub" claim is the user id. The caller can now trust it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ClerkJwtVerifier {

    /** Request-attribute name the filter stores the verified user id under. */
    public static final String USER_ID_ATTRIBUTE = "userId";

    private final ClerkConfig clerkConfig;

    // Built once at startup, reused for every request (thread-safe).
    private HttpsJwksVerificationKeyResolver keyResolver;
    private JwtConsumer jwtConsumer;

    /**
     * Wires everything up right after Spring injects ClerkConfig — fail-fast.
     * If CLERK_JWKS_URL is missing, the server REFUSES to start. That is the
     * safe default: without this check the filter could silently sit disabled
     * and the API would be open — exactly the hole we're closing.
     */
    @PostConstruct
    void init() {
        String jwksUrl = clerkConfig.getJwksUrl();
        if (jwksUrl == null || jwksUrl.isBlank()) {
            throw new IllegalStateException(
                    "CLERK_JWKS_URL is not set. The backend refuses to start because the "
                    + "/api endpoints would run UNAUTHENTICATED. (Fail closed, not open.)");
        }

        // NOTE: in jose4j 0.7.x, HttpsJwks throws UNCHECKED Exceptions — a bad URL
        // only blows up at first fetch time, wrapped in InvalidTokenException → 401.
        // The null/blank guard above catches the real misconfiguration (forgetting
        // to set the var); a malformed-but-present URL is a config bug we'll spot
        // instantly from the auth failure in logs.
        HttpsJwks httpsJwks = new HttpsJwks(jwksUrl);
        keyResolver = new HttpsJwksVerificationKeyResolver(httpsJwks);

        jwtConsumer = new JwtConsumerBuilder()
                .setRequireExpirationTime()           // "exp" must exist
                .setAllowedClockSkewInSeconds(30)     // tolerate small clock drift with Clerk
                .setRequireSubject()                  // "sub" must exist (= the user id)
                .setExpectedIssuer(clerkConfig.getIssuer()) // "iss" must be OUR Clerk instance
                .setVerificationKeyResolver(keyResolver)    // which public key to verify with
                .build();

        log.info("Clerk JWT verification enabled — issuer: {}", clerkConfig.getIssuer());
    }

    /**
     * Verify a Bearer token and return the user id it was issued to.
     *
     * @param token the raw JWT from the Authorization header
     * @return the Clerk user id ("sub" claim)
     * @throws InvalidTokenException if the token fails ANY check
     */
    public String verifyAndGetUserId(String token) {
        try {
            JwtClaims claims = jwtConsumer.processToClaims(token);
            return claims.getSubject();
        } catch (InvalidJwtException | MalformedClaimException e) {
            throw new InvalidTokenException(e);
        }
    }
}