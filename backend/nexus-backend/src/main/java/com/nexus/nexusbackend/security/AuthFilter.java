package com.nexus.nexusbackend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * The front door for every /api request.
 *
 * A servlet filter runs BEFORE the controller layer for every request. We chose
 * a plain filter over Spring Security because CUE's API needs exactly ONE
 * concern — JWT verification — and a ~50 line filter makes that security
 * surface explicit instead of burying it in a SecurityFilterChain of defaults
 * we don't use.
 *
 * FLOW:
 *   request → not /api, or an OPTIONS preflight? → pass through untouched
 *   /api/*  → read "Authorization: Bearer <token>"        → missing → 401
 *           → ClerkJwtVerifier.verifyAndGetUserId(token)  → fails  → 401
 *           → ok: stash verified user id on the request    → controller
 *
 * The controller reads request.getAttribute("userId") — a value that came from
 * the VERIFIED TOKEN, never from the client. That is the whole point of this
 * lock: the backend stopped trusting whatever "userId" the browser claimed.
 *
 * WHY LET OPTIONS THROUGH?
 *   Browsers send an OPTIONS "preflight" before a cross-origin request, and a
 *   preflight carries NO auth header. CorsConfig answers the preflight; if this
 *   filter 401'd it, the browser would never even send the real request.
 */
@Component
@RequiredArgsConstructor
public class AuthFilter extends OncePerRequestFilter {

    private final ClerkJwtVerifier verifier;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean isApi = path.startsWith("/api/");
        boolean isPreflight = "OPTIONS".equalsIgnoreCase(request.getMethod());
        return !isApi || isPreflight;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            reject(response, "Missing Authorization: Bearer <token> header");
            return;
        }

        String token = header.substring(7); // strip the "Bearer " prefix
        try {
            String userId = verifier.verifyAndGetUserId(token);
            request.setAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE, userId);
            chain.doFilter(request, response);
        } catch (InvalidTokenException e) {
            reject(response, "Invalid or expired token");
        }
    }

    /** 401 in the same { "error": "..." } shape the rest of the API uses. */
    private static void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }
}