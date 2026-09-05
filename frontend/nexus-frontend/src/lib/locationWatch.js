/**
 * locationWatch.js — live geofence monitoring for location reminders.
 *
 * Runs in the browser while the app is open. Uses watchPosition (a continuous
 * GPS stream) to check if the user has entered any reminder's radius. When
 * they do, it fires a callback — which the caller uses to show a banner or
 * trigger a system notification.
 *
 * Honest about platform limits: this ONLY works while the app is open.
 * Web browsers do not offer background geofencing. For true background
 * location alerts, you'd need a native app (iOS/Android). This is the best
 * we can do on the web, and it's genuinely useful — the user often has the
 * app open when arriving somewhere.
 *
 * Dependencies: none (pure JS, no React).
 */

/**
 * Start watching the user's position and fire onAlert(reminder) when they
 * enter the radius of any active location reminder.
 *
 * @param {Array} reminders — the user's location reminders (with latitude,
 *   longitude, radius, isDone, type fields)
 * @param {Function} onAlert — called with the reminder object when geofenced
 * @param {Object} options — optional config
 * @param {number} options.minIntervalMs — cooldown per reminder (default 30s,
 *   so re-entering the same zone doesn't spam)
 * @returns {Function} cleanup — call to stop watching (remove on unmount)
 */
export function startGeofenceWatch(reminders, onAlert, { minIntervalMs = 30_000 } = {}) {
    const cooldowns = {} // { reminderId: timestamp } — last time we alerted

    // Update cooldowns: clear any reminder whose cooldown has expired.
    // Without this, a user who stays in the zone forever would never re-alert.
    function clearExpiredCooldowns() {
        const now = Date.now()
        for (const id in cooldowns) {
            if (now - cooldowns[id] > minIntervalMs) {
                delete cooldowns[id]
            }
        }
    }

    const watcher = navigator.geolocation.watchPosition(
        (pos) => {
            clearExpiredCooldowns()

            for (const r of reminders) {
                // Skip: wrong type, no coordinates, or already done
                if (r.type !== 'location' || !r.latitude || !r.longitude || r.isDone) continue

                // Skip: still in cooldown for this reminder
                if (cooldowns[r.id]) continue

                const dist = haversineDistance(
                    pos.coords.latitude, pos.coords.longitude,
                    r.latitude, r.longitude
                )

                if (dist <= r.radius) {
                    onAlert(r)
                    cooldowns[r.id] = Date.now()
                }
            }
        },
        (err) => {
            // Permission denied, timeout, or position unavailable.
            // Log and keep watching — the browser might recover.
            if (err.code !== err.TIMEOUT) {
                console.warn('Geofence watch error:', err.message)
            }
        },
        {
            enableHighAccuracy: false,  // save battery; radius is usually large enough
            timeout: 15_000,           // wait up to 15s for a position
            maximumAge: 10_000,        // allow a 10s-old cached position (saves battery)
        }
    )

    // Return a cleanup function — call this on component unmount so we
    // don't leak GPS watchers.
    return () => navigator.geolocation.clearWatch(watcher)
}

/**
 * Haversine distance between two lat/lng points, in METERS.
 * This is the standard great-circle distance formula. The Earth is
 * approximately a sphere of radius 6,371 km — accurate to ~0.3%.
 *
 * @returns {number} distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6_371_000 // Earth's radius in meters
    const toRad = (d) => (d * Math.PI) / 180

    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}