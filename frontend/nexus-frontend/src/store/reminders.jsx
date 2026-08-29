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

  // The guard (the door guard). A time-based reminder can never be scheduled
  // in the past — 'type' must be "time" AND have a date AND that date must be
  // in the future. Lives here so EVERY page that walks through this door is covered.
  const isPastTime = (type, remindAt) =>
    type === 'time' && remindAt && new Date(remindAt) <= new Date()

  const value = {
    reminders: state.reminders,
    editingId: state.editingId,

    // Each door returns { ok, error } — the page listens for the verdict.
    addReminder: (reminder) => {
      if (isPastTime(reminder.type, reminder.remindAt)) {
        return { ok: false, error: 'Time has already passed' }
      }
      dispatch({ type: 'add', payload: reminder })
      return { ok: true }
    },

    toggleDone: (id) => dispatch({ type: 'toggle', payload: { id } }),

    editReminder: (id, changes) => {
      if (isPastTime(changes.type, changes.remindAt)) {
        return { ok: false, error: 'Time has already passed' }
      }
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
