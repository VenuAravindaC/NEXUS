/**
 * sw.js — the CUE service worker (source).
 *
 * vite-plugin-pwa uses the "injectManifest" strategy: this file is the REAL
 * service worker, and the plugin compiles it + injects the precache manifest
 * at build time. That's why we import from workbox packages — the plugin
 * bundles them for us.
 *
 * A service worker is a special script that runs in its OWN thread, separate
 * from the page. It survives tab closes. That's what lets push messages wake
 * it up and show a system notification even when the app isn't open.
 *
 * This worker handles 3 jobs:
 *   1. Push events  → show a system notification (when the app is closed)
 *                     and tell any OPEN page to show an in-app banner
 *   2. Clicks       → open/focus the right page when the user taps
 *   3. Precache     → install-time asset cache (PWA offline shell) injected
 *                     by vite-plugin-pwa from self.__WB_MANIFEST
 */

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

self.skipWaiting()
clientsClaim()

// vite-plugin-pwa replaces __WB_MANIFEST with the list of build assets.
precacheAndRoute(self.__WB_MANIFEST)

// ---- 1. A push message arrived from the backend ----
self.addEventListener('push', (event) => {
  // event.data is the payload we encrypted in WebPushSender. If there's no
  // payload (a "tickle"), fall back to a generic title.
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {} // malformed payload — show a generic notification
  }

  const title = data.title || 'CUE'
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/dashboard' },
  }

  // event.waitUntil keeps the service worker ALIVE while we do async work —
  // showNotification + notifying open pages. Without it, the worker could be
  // killed mid-way and the notification lost.
  event.waitUntil((async () => {
    await self.registration.showNotification(title, options)

    // Tell any OPEN page (an app tab) to show an in-app banner too.
    // We can't call the page directly — the page is another thread — but we
    // CAN send it a message and it decides what to do. We include the same
    // deep-link URL the notification carries, so the banner can navigate to
    // the same place a click on the system notification would.
    const openWindows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of openWindows) {
      client.postMessage({ type: 'push-received', title, body: data.body, url: data.url || '/dashboard' })
    }
  })())
})

// ---- 2. User clicked the notification ----
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // The target URL was sent with the notification (deep link, e.g. /dashboard).
  const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin)
  const targetHref = target.href

  event.waitUntil((async () => {
    const openWindows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    // If an CUE tab is already open, focus it and navigate to the target,
    // instead of spawning a duplicate window.
    for (const client of openWindows) {
      if (client.url === targetHref && 'focus' in client) {
        return client.focus()
      }
    }

    // Prefer navigating an existing CUE tab over opening a new window.
    for (const client of openWindows) {
      if ('navigate' in client) {
        try {
          await client.navigate(targetHref)
          return client.focus()
        } catch {
          // fall through to openWindow
        }
      }
    }

    // No usable tab — open a fresh one.
    return self.clients.openWindow(targetHref)
  })())
})