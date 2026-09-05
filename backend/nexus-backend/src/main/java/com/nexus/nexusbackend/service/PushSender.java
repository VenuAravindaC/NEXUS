package com.nexus.nexusbackend.service;

/**
 * The PushSender interface — the deep seam.
 *
 * The scheduler never calls the web-push library directly. It only talks to
 * this interface. That means we can swap push providers without touching the
 * scheduler:
 *   - Swap from FCM to Web Push → change the implementation class
 *   - Add fallbacks (try FCM, then Web Push) → new implementation class
 *   - Add logging/metrics → new implementation class (decorator pattern)
 *
 * Classic "program to an interface, not an implementation" — the scheduler
 * is decoupled from HOW messages get delivered, and only knows WHAT to deliver.
 *
 * The interface signature is minimal: userId + notification content + a route
 * for deep-linking (which page to open when the user clicks the notification).
 */
public interface PushSender {

    /**
     * Send a push notification to all of a user's registered devices.
     * Best-effort: if one device fails, the others still get the message.
     * Errors are logged, not thrown.
     *
     * @param userId the Clerk user id — used to look up device subscriptions
     * @param title  the notification title (shown in bold)
     * @param body   the notification body (the detail text)
     * @param route  the URL path to open when the notification is clicked
     */
    void send(String userId, String title, String body, String route);
}