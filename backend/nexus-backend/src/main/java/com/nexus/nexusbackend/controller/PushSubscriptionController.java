package com.nexus.nexusbackend.controller;

import com.nexus.nexusbackend.model.PushSubscription;
import com.nexus.nexusbackend.security.ClerkJwtVerifier;
import com.nexus.nexusbackend.service.PushSubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * The Controller — the "door" for push-subscription traffic.
 *
 * When the user toggles notifications ON in the frontend, the browser
 * builds a subscription and the frontend POSTs it here to be stored.
 * When they toggle OFF, the frontend DELETEs it.
 *
 * SECURITY: same defense as ReminderController. The userId the client sends is
 * ignored — the real one comes from the verified JWT via
 * request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE). A device can only
 * ever be registered to the person who owns the token.
 *
 * A Java record is a compact immutable class — perfect for a request body
 * that has no behavior, just data. The nested {@code Keys} record mirrors
 * the JSON shape the frontend actually sends:
 *
 *   { "userId": "...", "endpoint": "https://...", "keys": { "p256dh": "...", "auth": "..." } }
 *
 * Jackson (Spring's JSON library) reads that JSON and builds the record for us.
 */
@RestController
@RequestMapping("/api/push-subscriptions")
@RequiredArgsConstructor
public class PushSubscriptionController {

    /**
     * Request body for POST — matches the frontend's subscribeToPush() payload.
     * userId is KEPT in the DTO but IGNORED on purpose: the trusted value comes
     * from the JWT. (Kept because the current frontend still sends it; once the
     * frontend drops it from the payload, this field can go too.)
     */
    public record PushSubscriptionRequest(String userId, String endpoint, Keys keys) {
        public record Keys(String p256dh, String auth) {}
    }

    private final PushSubscriptionService pushSubscriptionService;

    /**
     * POST /api/push-subscriptions
     *
     * Stores a device's subscription. Returns 201 Created + the saved row
     * (now with a real UUID from the DB).
     */
    @PostMapping
    public ResponseEntity<PushSubscription> saveSubscription(
            @RequestBody PushSubscriptionRequest request,
            HttpServletRequest httpRequest) {

        String userId = (String) httpRequest.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE);

        PushSubscription sub = PushSubscription.builder()
                .userId(userId)                     // from the JWT, never from the body
                .endpoint(request.endpoint())
                .p256dh(request.keys().p256dh())
                .auth(request.keys().auth())
                .build();
        PushSubscription saved = pushSubscriptionService.saveSubscription(sub);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * DELETE /api/push-subscriptions?endpoint=...
     *
     * Removes a subscription (user turned notifications off, or the device
     * unsubscribed). The Service's ownership check returns 404 if the
     * endpoint doesn't belong to this user.
     * Returns 204 No Content if deleted.
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteSubscription(
            @RequestParam String endpoint,
            HttpServletRequest request) {

        String userId = (String) request.getAttribute(ClerkJwtVerifier.USER_ID_ATTRIBUTE);
        boolean removed = pushSubscriptionService.removeSubscription(endpoint, userId);
        return removed
                ? ResponseEntity.noContent().build()        // 204 No Content
                : ResponseEntity.notFound().build();        // 404 Not Found
    }
}