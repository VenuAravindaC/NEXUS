/**
 * geo.js — one home for all "geo knowledge".
 *
 * This is where we keep the OUTSIDE WORLD: the browser's GPS and the
 * OpenStreetMap reverse-geocoding (Nominatim) API. Keeping them here (and
 * tiny) is what makes the app testable — the rest of the app deals with plain
 * { latitude, longitude } objects and never touches the browser/network
 * directly, so we can swap these out in tests.
 */

const INDIA_CENTER = { latitude: 20.5937, longitude: 78.9629 }

/**
 * Ask the browser for the user's current position.
 * Resolves to { latitude, longitude }; rejects if the user denies permission
 * or the device can't tell. The caller decides the fallback.
 *
 * Wraps navigator.geolocation in a Promise so it feels/acts the same as a
 * normal async call — clean to mock in tests.
 */
export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Geolocation not supported'))
            return
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
            }),
            (err) => reject(err)
        )
    })
}

/**
 * Turn a latitude/longitude into a human place name, via the free
 * OpenStreetMap Nominatim API (no API key needed).
 * Resolves to a display name string, or falls back to "Pinned location"
 * if anything goes wrong — we never want a reverse-geocode hiccup to block
 * saving a pin.
 */
export async function reverseGeocode({ latitude, longitude }) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
        const res = await fetch(url, {
            // Nominatim asks clients to identify themselves with a User-Agent.
            headers: { 'User-Agent': 'NexusApp (learning project)' },
        })
        if (!res.ok) throw new Error(`Nominatim ${res.status}`)

        const data = await res.json()
        // Prefer a display_name; fall back across common fields just in case.
        const name = data.display_name || data.name
        return name || 'Pinned location'
    } catch {
        return 'Pinned location'
    }
}

// The default spot if we can't get the user's location. Export kept for the
// map component (it wants to centre on it) — same reason it lives here, not
// scattered in the component.
export { INDIA_CENTER as DEFAULT_CENTER }
