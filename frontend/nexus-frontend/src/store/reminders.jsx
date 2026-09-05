import { createContext, useContext, useReducer, useEffect } from 'react'
import { useUser } from '@clerk/react'

/**
 * Reminder shape (the "notebook" holds a list of these):
 * {
 *   id: string (UUID from DB),
 *   title: string,
 *   type: "time" | "location",
 *   remindAt: string | null,          // UTC timestamp for time-based
 *   latitude: number | null,          // for location-based
 *   longitude: number | null,         // for location-based
 *   locationName: string | null,      // display name for location
 *   radius: number,                   // meters, default 250
 *   isDone: boolean,
 *   createdAt: string                 // UTC timestamp
 * }
 */

// The backend URL — set VITE_API_URL=http://localhost:8080 in .env.local
const API_URL = import.meta.env.VITE_API_URL

// The shared table. Pages that call useReminders() subscribe to this.
const RemindersContext = createContext(null)

/**
 * The rulebook: (current state, "what you want to do") -> next state.
 * Pure function — always returns the same answer for the same inputs,
 * and never mutates the existing state (we build new arrays with spread/map/filter).
 */
function remindersReducer(state, action) {
  switch (action.type) {
    // 'load' replaces the whole list — used on startup to hydrate from the server
    case 'load':
      return { ...state, reminders: action.payload }

    case 'add':
      return { ...state, reminders: [...state.reminders, action.payload] }

    case 'toggle':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.payload.id ? { ...r, isDone: !r.isDone } : r
        ),
      }

    case 'edit':
      return {
        ...state,
        reminders: state.reminders.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload.changes } : r
        ),
      }

    case 'delete':
      return {
        ...state,
        reminders: state.reminders.filter((r) => r.id !== action.payload.id),
      }

    case 'startEdit':
      return { ...state, editingId: action.payload.id }

    case 'stopEdit':
      return { ...state, editingId: null }

    default:
      return state
  }
}

/**
 * The Provider: holds the notebook (useReducer) and gives every page
 * a tidy interface. This is where ALL reminder state lives now.
 *
 * Now fetch-backed: on mount, loads reminders from the backend.
 * Every CRUD action calls the API and updates local state on success.
 */
export function RemindersProvider({ children }) {
  const { user, isLoaded } = useUser()  // get the logged-in user from Clerk
  const [state, dispatch] = useReducer(remindersReducer, {
    reminders: [],
    editingId: null,
  })

  /**
   * Load reminders from the backend when the user is known.
   * Runs once when isLoaded becomes true and user is available.
   */
  useEffect(() => {
    if (!isLoaded || !user) return  // wait until Clerk knows who's logged in

    fetch(`${API_URL}/api/reminders?userId=${user.id}`)
      .then(res => res.json())
      .then(data => dispatch({ type: 'load', payload: data }))
      .catch(err => console.error('Failed to load reminders:', err))
  }, [isLoaded, user])  // re-run if user changes (e.g. after login)

  // The guard (the door guard). One pure function checks EVERY rule a reminder
  // must satisfy before it's allowed in. Lives here so every page is covered.
  const validationError = (reminder) => {
    if (
      reminder.type === 'time' &&
      reminder.remindAt &&
      new Date(reminder.remindAt) <= new Date()
    ) {
      return 'Time has already passed'
    }
    if (
      reminder.type === 'location' &&
      (!reminder.latitude || !reminder.longitude)
    ) {
      return 'Pick a location on the map'
    }
    return null
  }

  const value = {
    reminders: state.reminders,
    editingId: state.editingId,

    // Each door returns { ok, error } — the page listens for the verdict.
    addReminder: async (reminder) => {
      const err = validationError(reminder)
      if (err) return { ok: false, error: err }

      try {
        const res = await fetch(`${API_URL}/api/reminders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...reminder, userId: user.id }),
        })
        if (!res.ok) return { ok: false, error: 'Failed to save reminder' }
        const saved = await res.json()  // server returns the saved reminder with real UUID
        dispatch({ type: 'add', payload: saved })
        return { ok: true }
      } catch {
        return { ok: false, error: 'Network error' }
      }
    },

    toggleDone: async (id) => {
      const reminder = state.reminders.find(r => r.id === id)
      if (!reminder) return

      // Optimistic update — flip immediately so the UI feels instant
      dispatch({ type: 'toggle', payload: { id } })

      try {
        const res = await fetch(`${API_URL}/api/reminders/${id}?userId=${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...reminder, isDone: !reminder.isDone }),
        })
        if (!res.ok) {
          // Server failed — roll back the optimistic update
          dispatch({ type: 'toggle', payload: { id } })
        }
      } catch (err) {
        // Network error — roll back
        dispatch({ type: 'toggle', payload: { id } })
        console.error('Failed to toggle reminder:', err)
      }
    },

    editReminder: async (id, changes) => {
      const err = validationError(changes)
      if (err) return { ok: false, error: err }

      const reminder = state.reminders.find(r => r.id === id)
      if (!reminder) return { ok: false, error: 'Reminder not found' }

      try {
        const res = await fetch(`${API_URL}/api/reminders/${id}?userId=${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...reminder, ...changes }),
        })
        if (!res.ok) return { ok: false, error: 'Failed to update reminder' }
        const updated = await res.json()
        dispatch({ type: 'edit', payload: { id, changes: updated } })
        return { ok: true }
      } catch {
        return { ok: false, error: 'Network error' }
      }
    },

    deleteReminder: async (id) => {
      // Optimistic update — remove immediately so the UI feels instant
      dispatch({ type: 'delete', payload: { id } })

      try {
        const res = await fetch(`${API_URL}/api/reminders/${id}?userId=${user.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) {
          // Server failed — reload from server to restore correct state
          const data = await fetch(`${API_URL}/api/reminders?userId=${user.id}`).then(r => r.json())
          dispatch({ type: 'load', payload: data })
        }
      } catch (err) {
        console.error('Failed to delete reminder:', err)
      }
    },

    startEdit: (id) => dispatch({ type: 'startEdit', payload: { id } }),
    stopEdit: () => dispatch({ type: 'stopEdit' }),
  }

  return (
    <RemindersContext.Provider value={value}>
      {children}
    </RemindersContext.Provider>
  )
}

/**
 * The hook pages call: "gimme the reminders and the actions."
 * Throws if used outside a Provider (catches mistakes early).
 */
export function useReminders() {
  const context = useContext(RemindersContext)
  if (!context) {
    throw new Error('useReminders must be used within a RemindersProvider')
  }
  return context
}
