/**
 * api.js — the ONE place the frontend knows the backend's address,
 * plus the shared helpers for talking to it with the user's JWT.
 *
 * authFetch is where the bearer token gets attached. Every API call in the
 * app goes through it: the Clerk token proves WHO the user is, and the backend
 * (now behind AuthFilter) derives the userId from that token — it stopped
 * trusting a userId the client just claims in a query param.
 */

export const API_URL = import.meta.env.VITE_API_URL

/**
 * fetch, but with the signed-in user's Clerk JWT attached as an Authorization
 * header. Almost every call here is JSON, so that is the default content type.
 *
 * @param {string} path  e.g. "/api/reminders" (relative — API_URL is added)
 * @param {object} opts  { token, method, body } — body is JSON-serialized
 */
export async function authFetch(path, { token, method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  // No token? Leave the header off — the backend answers 401 and the caller
  // surfaces that as an error. Better than silently pretending to be someone.
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

/**
 * Fetch every reminder belonging to the signed-in user.
 * Used to hydrate the app on load, and to re-sync after a delete rolled back.
 *
 * The backend decides WHICH user from the token — there is no userId query
 * param anymore, because the client no longer gets to say who they are.
 */
export async function fetchReminders(token) {
  const res = await authFetch('/api/reminders', { token })
  return res.json()
}