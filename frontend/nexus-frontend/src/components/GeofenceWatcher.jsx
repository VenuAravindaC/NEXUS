/**
 * GeofenceWatcher.jsx — mounts inside RemindersProvider, starts the GPS watch.
 *
 * This component has no UI. Its only job is to call startGeofenceWatch()
 * with the user's location reminders and dispatch a 'geofence-alert'
 * CustomEvent when one fires — which NotificationBanner picks up.
 *
 * Why a component (not a hook)?
 *   - A hook would need to be called at the top level of RemindersProvider,
 *     which mixes concerns. A component is self-contained and declarative.
 *   - It's a single <GeofenceWatcher /> in App.jsx — easy to see, easy to remove.
 *   - Unmounting it cleanly stops the GPS watcher (via the cleanup return).
 *
 * Honest about limits: this ONLY works while the app is open. The browser's
 * watchPosition stops when the tab is backgrounded on most mobile browsers.
 * For true background geofencing, you'd need a native app. This is the best
 * the web platform offers today, and it's genuinely useful — users often
 * have the app open while traveling to a location.
 */

import { useEffect } from 'react'
import { useReminders } from '../store/reminders'
import { startGeofenceWatch } from '../lib/locationWatch'

function GeofenceWatcher() {
    const { reminders } = useReminders()

    useEffect(() => {
        // Filter to active (not done) location reminders with valid coordinates.
        const active = reminders.filter(
            (r) => r.type === 'location' && r.latitude && r.longitude && !r.isDone
        )
        if (!active.length) return

        // Start watching — returns a cleanup function.
        const cleanup = startGeofenceWatch(active, (reminder) => {
            // Dispatch a CustomEvent so NotificationBanner can show it.
            // We also ask the browser for a system notification (best-effort)
            // so the user sees SOMETHING even if they're on a different tab.
            window.dispatchEvent(new CustomEvent('geofence-alert', { detail: reminder }))

            if (Notification.permission === 'granted') {
                new Notification('📍 Location Reminder', {
                    body: reminder.title || 'You have arrived!',
                    icon: '/icons/icon-192.png',
                })
            }
        })

        return cleanup
    }, [reminders])

    // No UI — this is a pure side-effect component.
    return null
}

export default GeofenceWatcher