import { createContext, useContext, useReducer } from 'react'

/**
 * Reminder shape (the "notebook" holds a list of these):
 * {
 *   id: string,
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

// The shared table. Pages that call useReminders() subscribe to this.
const RemindersContext = createContext(null)

/**
 * The rulebook: (current state, "what you want to do") -> next state.
 * Pure function — always returns the same answer for the same inputs,
 * and never mutates the existing state (we build new arrays with spread/map/filter).
 */
function remindersReducer(state, action) {
  switch (action.type) {
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
 */
export function RemindersProvider({ children }) {
  const [state, dispatch] = useReducer(remindersReducer, {
    reminders: [],
    editingId: null,
  })

  // The guard (the door guard). One pure function checks EVERY rule a reminder
  // must satisfy before it's allowed in — time reminders can't be in the past,
  // and location reminders must have a spot picked. Lives here so every page
  // that walks through this door is covered. Returns an error string or null.
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
    addReminder: (reminder) => {
      const err = validationError(reminder)
      if (err) return { ok: false, error: err }
      dispatch({ type: 'add', payload: reminder })
      return { ok: true }
    },

    toggleDone: (id) => dispatch({ type: 'toggle', payload: { id } }),

    editReminder: (id, changes) => {
      const err = validationError(changes)
      if (err) return { ok: false, error: err }
      dispatch({ type: 'edit', payload: { id, changes } })
      return { ok: true }
    },

    deleteReminder: (id) => dispatch({ type: 'delete', payload: { id } }),
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
