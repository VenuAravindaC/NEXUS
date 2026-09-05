package com.nexus.nexusbackend.service;

import com.nexus.nexusbackend.config.VapidConfig;
import com.nexus.nexusbackend.model.PushSubscription;
import com.nexus.nexusbackend.service.PushSubscriptionService;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;

/**
 * WebPushSender — the implementation that actually talks to the push provider.
 *
 * This is the only class that touches the web-push library (nl.martijndwars).
 * The scheduler (which calls PushSender.send()) is oblivious to this — it only
 * sees the interface.
 *
 * How it works:
 * 1. Read VAPID keys from VapidConfig (env vars).
 * 2. Initialize the PushService with the keys + BC provider (for ECDH crypto).
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
 */
@Slf4j
@Service
public class WebPushSender implements PushSender {

    private final PushSubscriptionService pushSubscriptionService;
    private final PushService pushService;

    /**
     * Spring creates this class once (singleton) and injects VapidConfig
     * (which read the env vars) and PushSubscriptionService.
     */
    public WebPushSender(VapidConfig vapidConfig,
                         PushSubscriptionService pushSubscriptionService) throws GeneralSecurityException {
        this.pushSubscriptionService = pushSubscriptionService;

        // Register BouncyCastle — required for the ECDH key derivation inside
        // the web-push encryption. Adding it once at startup is sufficient.
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }

        // Build the PushService with our VAPID credentials.
        // The 3-arg constructor is (publicKey, privateKey, subject).
        // Throws GeneralSecurityException if the keys are malformed.
        this.pushService = new PushService(
                vapidConfig.getPublicKey(),
                vapidConfig.getPrivateKey(),
                vapidConfig.getSubject()
        );
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
     * Simple hand-built JSON (no library needed for three flat strings).
     */
    private String buildPayload(String title, String body, String route) {
        String safeTitle = escapeJson(title);
        String safeBody = escapeJson(body);
        String safeRoute = escapeJson(route);
        return "{\"title\":\"" + safeTitle + "\",\"body\":\"" + safeBody + "\",\"url\":\"" + safeRoute + "\"}";
    }

    /** Escape the few characters that are illegal inside a JSON string value. */
    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}