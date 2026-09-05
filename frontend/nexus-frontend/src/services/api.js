/**
 * api.js — the ONE place the frontend knows the backend's address,
 * plus the shared "give me all of this user's reminders" fetch.
 *
 * Before this module:
 *   - API_URL was defined twice — store/reminders.jsx and lib/push.js.
 *     Two definitions means two places to forget when the URL changes.
 *   - The hydrate fetch was written at mount in reminders.jsx AND re-inlined
 *     inside deleteReminder's rollback path. Two copies of the same query.
 *
 * Now: the URL lives here, and the hydrate lives here. Callers (the store)
 * just call API_URL / fetchReminders(userId).
 *
 * Deliberately small. There's only ONE backend, so a full API-client module
 * with adapters and seams would be premature — that's a hypothetical seam,
 * and "one adapter = hypothetical seam." We keep just what's duplicated today
 * and build more helpers here as the duplication appears.
 */

export const API_URL = import.meta.env.VITE_API_URL

/**
 * Fetch every reminder belonging to a user, straight from the server.
 * Used to hydrate the app on load, and to re-sync after a delete rolled back.
 * Returns the parsed JSON array (the backend returns [{...}, {...}]).
 */
export async function fetchReminders(userId) {
  return fetch(`${API_URL}/api/reminders?userId=${userId}`).then((res) => res.json())
}