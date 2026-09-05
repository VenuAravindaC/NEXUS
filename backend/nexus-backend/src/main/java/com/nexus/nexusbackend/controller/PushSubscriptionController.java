package com.nexus.nexusbackend.controller;

import com.nexus.nexusbackend.model.PushSubscription;
import com.nexus.nexusbackend.service.PushSubscriptionService;
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
@CrossOrigin(origins = "*") // TODO: tighten to specific Vercel URL before production
public class PushSubscriptionController {

    /** Request body for POST — matches the frontend's subscribeToPush() payload. */
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
    public ResponseEntity<PushSubscription> saveSubscription(@RequestBody PushSubscriptionRequest request) {
        PushSubscription sub = PushSubscription.builder()
                .userId(request.userId())
                .endpoint(request.endpoint())
                .p256dh(request.keys().p256dh())
                .auth(request.keys().auth())
                .build();
        PushSubscription saved = pushSubscriptionService.saveSubscription(sub);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * DELETE /api/push-subscriptions?endpoint=...&userId=...
     *
     * Removes a subscription (user turned notifications off, or the device
     * unsubscribed). The Service's ownership check returns 404 if the
     * endpoint doesn't belong to this user.
     * Returns 204 No Content if deleted.
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteSubscription(
            @RequestParam String endpoint,
            @RequestParam String userId) {

        boolean removed = pushSubscriptionService.removeSubscription(endpoint, userId);
        return removed
                ? ResponseEntity.noContent().build()        // 204 No Content
                : ResponseEntity.notFound().build();        // 404 Not Found
    }
}