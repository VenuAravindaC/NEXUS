package com.nexus.nexusbackend.security;

/**
 * AuthenticatedUser — the typed identity of whoever made this request.
 *
 * This is the value that travels FROM the trust boundary (AuthFilter → verified
 * JWT → request attribute) INTO the controller layer. Before, controllers read
 * the raw attribute themselves — an untyped String copied in six places. Now
 * the UserIdArgumentResolver turns that attribute into this type exactly once,
 * and every controller just declares an AuthenticatedUser parameter.
 *
 * WHY A TYPE (not a String)?
 *   A String can be built by anyone, from anywhere; a record can only come
 *   from the verifier. When a service method takes AuthenticatedUser, the
 *   signature itself says "this must have passed through auth" — you can't
 *   accidentally pass a client-supplied string as if it were trusted.
 */
public record AuthenticatedUser(String userId) {}