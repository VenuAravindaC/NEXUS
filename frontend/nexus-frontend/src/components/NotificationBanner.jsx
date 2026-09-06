/**
 * NotificationBanner.jsx — in-app toast for push notifications + geofence alerts.
 *
 * Two channels feed this component:
 *   1. Push messages from the service worker (app is open, user sees both
 *      the system notification AND this banner)
 *   2. Geofence alerts from the live location watcher (location reminder
 *      triggered while the app is open)
 *
 * The banner auto-dismisses after 5 seconds, or the user can close it early.
 * It sits at the top of the viewport, above the page content, and does NOT
 * block interaction with the rest of the app (no modal).
 *
 * Why a banner (not just the system notification)?
 *   - The system notification disappears after a few seconds on most OSes.
 *   - An in-app banner gives a richer context: the user can see the reminder
 *     title while still on the app, and optionally click to navigate.
 *   - For geofence alerts, there IS no system notification (geofence runs
 *     in-app only), so this is the only visible signal.
 *
 * Clicking a push banner navigates to the same deep-link URL the system
 * notification carries — parity between the two surfaces. The service worker
 * includes { url } in the 'push-received' message; geofence banners have no
 * URL yet, so their body is not clickable.
 *
 * Wired into Layout.jsx (mounted once, above {children}).
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

const DISMISS_MS = 5_000 // auto-dismiss after 5 seconds

function NotificationBanner() {
    const navigate = useNavigate()
    const [banners, setBanners] = useState([])

    // Close a banner by index and clear its auto-dismiss timer.
    const dismiss = useCallback((index) => {
        setBanners((prev) => prev.filter((_, i) => i !== index))
    }, [])

    // Listen for two event channels:
    //   a) 'message' from the service worker (type: 'push-received') — carries
    //      the same { title, body, url } the service worker kept for itself, so
    //      clicking the banner goes to the same page as clicking the system
    //      notification.
    //   b) 'geofence-alert' CustomEvent from the location watcher — in-app only,
    //      no system notification, so there's no deep-link URL yet.
    useEffect(() => {
        const swHandler = (event) => {
            if (event.data?.type !== 'push-received') return
            addBanner(event.data.title, event.data.body, event.data.url)
        }

        const geofenceHandler = (event) => {
            const r = event.detail
            addBanner('📍 Location Reminder', r.title || 'You have arrived!', null)
        }

        function addBanner(title, body, url) {
            setBanners((prev) => [...prev, { title, body, url, id: Date.now() }])
        }

        navigator.serviceWorker?.addEventListener?.('message', swHandler)
        window.addEventListener('geofence-alert', geofenceHandler)

        return () => {
            navigator.serviceWorker?.removeEventListener?.('message', swHandler)
            window.removeEventListener('geofence-alert', geofenceHandler)
        }
    }, [])

    // Auto-dismiss each banner after DISMISS_MS.
    useEffect(() => {
        if (banners.length === 0) return
        const latest = banners[banners.length - 1]
        const timer = setTimeout(() => {
            setBanners((prev) => prev.filter((b) => b.id !== latest.id))
        }, DISMISS_MS)
        return () => clearTimeout(timer)
    }, [banners])

    if (banners.length === 0) return null

    return (
        <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {banners.map((b, i) => (
                <div
                    key={b.id}
                    className="pointer-events-auto bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 shadow-lg flex items-start gap-3 animate-slideDown"
                >
                    {b.url ? (
                        <button
                            onClick={() => navigate(b.url)}
                            className="flex-1 min-w-0 text-left"
                        >
                            <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                            {b.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{b.body}</p>}
                        </button>
                    ) : (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{b.title}</p>
                            {b.body && <p className="text-xs text-gray-400 mt-0.5 truncate">{b.body}</p>}
                        </div>
                    )}
                    <button
                        onClick={() => dismiss(i)}
                        className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5"
                        aria-label="Dismiss notification"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    )
}

export default NotificationBanner