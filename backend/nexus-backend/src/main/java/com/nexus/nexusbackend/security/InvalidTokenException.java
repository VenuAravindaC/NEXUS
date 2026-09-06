package com.nexus.nexusbackend.security;

/**
 * Thrown by ClerkJwtVerifier when a token fails verification — bad signature,
 * expired, wrong issuer, no "sub", or malformed.
 *
 * AuthFilter catches it and writes the 401 response. GlobalExceptionHandler
 * ALSO maps it to 401, so even if one ever leaked into a controller, it still
 * comes out as Unauthorized — belt and suspenders.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(Throwable cause) {
        super("Invalid or expired token", cause);
    }
}