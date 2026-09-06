/**
 * push.js — all the frontend Web Push knowledge in ONE place.
 *
 * Everything that touches the browser's Notification API, PushManager, or
 * the backend's /api/push-subscriptions endpoint lives here — clean of React,
 * so it can be unit-tested and reused. Components just call
 * subscribeToPush(token) and get { ok, error }.
 *
 * The flow:
 *   1. ask the user for notification permission
 *   2. subscribe the browser to the push PROVIDER (via PushManager) using our
 *      VAPID public key — this returns a PushSubscription (our "mailbox key")
 *   3. POST that subscription to our backend, which stores it in Postgres
 *
 * Later, the backend scheduler encrypts a payload with the VAPID private key
 * + this subscription and sends it through the provider.
 */

import { authFetch } from '../services/api'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * The browser's PushManager.subscribe expects the VAPID applicationServerKey
 * as a Uint8Array. Env vars give us base64url text, so we decode it.
 * This is the standard conversion — safe for mnemonic purposes.
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

/**
 * Does THIS browser have everything push needs?
 *   - Notification API (system notifications)
 *   - Service Worker (the background script that receives pushes)
 *   - PushManager (subscription control)
 * Older browsers miss one or more — we hide the toggle then.
 */
export function isNotificationSupported() {
    return (
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    )
}

/** Current permission: 'granted' | 'denied' | 'default' (never asked yet). */
export function getPermissionState() {
    return Notification.permission
}

/**
 * Turn notifications ON: ask permission → subscribe to the provider → save
 * the subscription on our backend. Returns { ok: true } or { ok: false, error }.
 *
 * Every step is wrapped in try/catch so errors surface clearly to the caller
 * instead of hanging or failing silently. navigator.serviceWorker.ready gets
 * a 10-second timeout so the function never hangs indefinitely if the
 * service worker failed to register.
 */
export async function subscribeToPush(token) {
    try {
        if (!isNotificationSupported()) {
            return { ok: false, error: 'Push not supported in this browser' }
        }

        // 1. Permission. If the user hasn't decided yet, ask. If they already
        //    denied, or we can't get permission, stop here — no point subscribing.
        if (Notification.permission === 'default') {
            await Notification.requestPermission()
        }
        if (Notification.permission !== 'granted') {
            return { ok: false, error: 'Notification permission denied' }
        }

        // 2. Service worker must be active before we can subscribe (the browser
        //    attaches the subscription to the SW registration). If the SW failed
        //    to register, navigator.serviceWorker.ready hangs forever — so we
        //    race it against a 10-second timeout and fail clearly.
        const registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Service worker took too long to activate')), 10_000)
            ),
        ])

        // 3. Subscribe to the provider. applicationServerKey proves to the
        //    provider that OUR app (VAPID keys) is allowed to send to this device.
        //    userVisibleOnly is required — browsers demand every push be visible.
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        // 4. Persist the subscription (the mailbox keys) on our backend so the
        //    scheduler can find it later. subscription.toJSON() gives us the
        //    nested { endpoint, expirationTime, keys: { p256dh, auth } } shape
        //    the backend's PushSubscriptionRequest record expects.
        const sub = subscription.toJSON()
        const res = await authFetch('/api/push-subscriptions', {
            token,
            method: 'POST',
            body: {
                // No userId here! The backend pulls it from the verified JWT.
                endpoint: subscription.endpoint,
                keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
            },
        })

        if (!res.ok) {
            return { ok: false, error: `Backend rejected subscription (HTTP ${res.status})` }
        }
        return { ok: true }
    } catch (err) {
        return { ok: false, error: err.message || 'Subscription failed unexpectedly' }
    }
}

/**
 * Turn notifications OFF: unsubscribe on the device AND delete the stored
 * subscription on the backend (so the scheduler stops sending to it).
 */
export async function unsubscribeFromPush(token) {
    try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        // If there's a subscription, tell the backend to forget it.
        if (subscription) {
            const res = await authFetch(`/api/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
                token,
                method: 'DELETE',
            })
            if (!res.ok) {
                return { ok: false, error: `Backend failed to remove subscription (HTTP ${res.status})` }
            }
            // Then unsubscribe on the provider side too.
            await subscription.unsubscribe()
        }
        return { ok: true }
    } catch (err) {
        return { ok: false, error: err.message }
    }
}