package com.nexus.nexusbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexus.nexusbackend.config.VapidConfig;
import com.nexus.nexusbackend.model.PushSubscription;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * WebPushSender — the implementation that actually talks to the push provider.
 *
 * This is the only class that touches the web-push library (nl.martijndwars).
 * The scheduler (which calls PushSender.send()) is oblivious to this — it only
 * sees the interface.
 *
 * How it works:
 * 1. Read VAPID keys from VapidConfig (env vars).
 * 2. Initialize the PushService via buildPushService() (the factory seam).
 * 3. On send(): look up every device subscription via PushSubscriptionService
 *    (the adapter seam) → build a Notification for each.
 * 4. If the provider says "410 Gone" → that subscription is dead, remove it
 *    through the service (not the repository directly).
 * 5. Any error on a single device is logged and skipped (best-effort fan-out).
 *
 * BouncyCastle: needed for the Elliptic Curve Diffie-Hellman that encrypts
 * the payload. Without it, PushService throws NoSuchProviderException: "BC".
 * We register the provider in the constructor (runs once at app startup).
 *
 * Subscription lookup and cleanup go through PushSubscriptionService (the seam),
 * NOT the repository directly. That way the subscription module owns all
 * subscription logic — the sender stays a pure "encrypt + post" adapter.
 *
 * TESTABILITY: the PushService construction is behind a package-visible
 * factory method (buildPushService). A test in the same package can override
 * this and inject a stub, avoiding the real BouncyCastle + network.
 */
@Slf4j
@Service
public class WebPushSender implements PushSender {

    private final PushSubscriptionService pushSubscriptionService;
    private final PushService pushService;
    private final ObjectMapper objectMapper;

    /**
     * Spring creates this class once (singleton) and injects VapidConfig
     * (which read the env vars), PushSubscriptionService, and Jackson's
     * ObjectMapper (auto-configured by spring-boot-starter-web).
     *
     * The PushService is built via buildPushService() — the factory seam —
     * so a test in the same package can override it with a stub.
     */
    public WebPushSender(VapidConfig vapidConfig,
                         PushSubscriptionService pushSubscriptionService,
                         ObjectMapper objectMapper) {
        this.pushSubscriptionService = pushSubscriptionService;
        this.objectMapper = objectMapper;
        this.pushService = buildPushService(vapidConfig);
    }

    /**
     * The factory seam: builds the real PushService from VAPID credentials.
     * Package-visible so a test in the same package can override this and
     * return a stub — making the whole class unit-testable without
     * BouncyCastle or a real push provider.
     */
    PushService buildPushService(VapidConfig vapidConfig) {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        try {
            return new PushService(
                    vapidConfig.getPublicKey(),
                    vapidConfig.getPrivateKey(),
                    vapidConfig.getSubject()
            );
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to initialize push service — check VAPID keys", e);
        }
    }

    /**
     * Fan-out: send the same notification to EVERY device the user registered.
     *
     * Each device gets its own encrypted copy of the payload (because the
     * encryption uses the device's unique p256dh/public key). The library
     * handles this per-device encryption in the send() call.
     */
    @Override
    public void send(String userId, String title, String body, String route) {
        List<PushSubscription> subscriptions = pushSubscriptionService.getSubscriptionsForUser(userId);
        if (subscriptions.isEmpty()) return;

        String payload = buildPayload(title, body, route);

        for (PushSubscription sub : subscriptions) {
            try {
                Notification notification = new Notification(
                        new Subscription(sub.getEndpoint(),
                                new Subscription.Keys(sub.getP256dh(), sub.getAuth())),
                        payload
                );
                HttpResponse response = pushService.send(notification);
                int status = response.getStatusLine().getStatusCode();

                if (status == 410) {
                    // 410 Gone — the push provider says this device mailbox is dead
                    // (user cleared browser data, or re-subscribed with new keys).
                    // Let the subscription service handle the cleanup.
                    log.info("Removing stale push subscription (410 Gone): {}", sub.getEndpoint());
                    pushSubscriptionService.removeSubscription(sub.getEndpoint(), sub.getUserId());
                } else if (status >= 400) {
                    log.warn("Push delivery failed (HTTP {}): {}", status, sub.getEndpoint());
                } else {
                    // 2xx (usually 201 Created) — the push provider accepted and
                    // queued the message for delivery. Log it so a scheduled
                    // notification leaves a trace in the terminal (success used
                    // to be silent, which made it impossible to tell if a send
                    // actually happened or was a no-op).
                    log.info("Push accepted by provider (HTTP {}): {}", status, sub.getEndpoint());
                }
            } catch (Exception e) {
                // Best-effort: if one device fails, continue to the next.
                // This could be a network hiccup, a malformed subscription, etc.
                log.warn("Error sending push to {}: {}", sub.getEndpoint(), e.getMessage());
            }
        }
    }

    /**
     * Build the JSON payload the service worker will receive and display.
     *
     * WHY JACKSON? The previous version hand-escaped backslash and double-quote,
     * but a title containing a newline, tab, or control character would produce
     * invalid JSON — the service worker's event.data.json() would fail to parse.
     * Jackson's ObjectMapper handles all JSON escaping correctly, always.
     * ObjectMapper is a thread-safe, stateful builder that Spring auto-configures;
     * we reuse the one singleton it creates.
     */
    String buildPayload(String title, String body, String route) {
        try {
            Map<String, String> payload = new LinkedHashMap<>();
            payload.put("title", title != null ? title : "CUE");
            payload.put("body", body != null ? body : "");
            payload.put("url", route != null ? route : "/dashboard");
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            // Should never happen — ObjectMapper.writeValueAsString only throws
            // on streams, not on String builds. Defensive fallback.
            log.error("Failed to build push payload", e);
            return "{\"title\":\"CUE\",\"body\":\"\",\"url\":\"/dashboard\"}";
        }
    }
}