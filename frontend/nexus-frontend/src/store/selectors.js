/**
 * selectors.js — the READ-side of the notebook.
 *
 * Every "what should this page show?" rule lives here, once, instead of each
 * page re-deriving the same question with subtle differences.
 *
 * All pure functions: same list in → same answer out. Unit-testable.
 * Import them where you need a slice:
 *   Dashboard → selectActiveReminders   (today + future, location always, newest first)
 *   Upcoming  → selectUpcomingReminders (future time-based, not done, soonest first)
 *   Calendar  → selectDayReminders      (one day's record, done included)
 */

/**
 * Is this reminder on the Dashboard's attention list?
 * Location reminders have no date to expire → always active.
 * Time reminders are active while their day hasn't fully passed.
 */
export const isActiveReminder = (reminder, now = new Date()) => {
  if (reminder.type === 'location') return true
  if (!reminder.remindAt) return true

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  return new Date(reminder.remindAt) >= todayStart
}

/** Dashboard: the active ones, newest created first. */
export const selectActiveReminders = (list) =>
  [...list]
    .filter(isActiveReminder)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

/** Upcoming: everything you haven't done yet (time + location), soonest first. */
export const selectUpcomingReminders = (list, now = new Date()) =>
  list
    .filter((r) => !r.isDone && (r.type === 'time' || r.type === 'location'))
    .sort((a, b) => {
      // Location reminders have no remindAt — pin them at the bottom
      if (!a.remindAt) return 1
      if (!b.remindAt) return -1
      return new Date(a.remindAt) - new Date(b.remindAt)
    })

/** "2026-09-05" in the user's LOCAL zone — the day they meant. */
export const localDateKey = (date) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Set of local day-keys that carry at least one time reminder (the dots). */
export const reminderDayKeys = (list) =>
  new Set(
    list
      .filter((r) => r.type === 'time' && r.remindAt)
      .map((r) => localDateKey(new Date(r.remindAt)))
  )

/** One day's full record — done included — earliest first (Calendar). */
export const selectDayReminders = (list, dateKey) =>
  list
    .filter(
      (r) =>
        r.type === 'time' &&
        r.remindAt &&
        localDateKey(new Date(r.remindAt)) === dateKey
    )
    .sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt))