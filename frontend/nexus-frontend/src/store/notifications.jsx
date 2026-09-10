import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
    isNotificationSupported,
    getPermissionState,
    subscribeToPush,
    unsubscribeFromPush,
} from '../lib/push'

/**
 * NotificationsProvider — owns the single source of truth for notification
 * permission + subscription state.
 *
 * Before this module, NotificationPrompt and ProfilePage each independently
 * re-derive Notification.permission and drive subscribe/unsubscribe. A toggle
 * in Profile wasn't seen by the Prompt — they could drift out of sync.
 *
 * Now both widgets call useNotifications() and read the same shared fact.
 * The adapter (lib/push.js) stays React-free — this module is a thin
 * React wrapper that makes the state live in one place.
 *
 * RemindersProvider owns the reminder data + CRUD.
 * NotificationsProvider owns the notification settings + toggle.
 * They're independent concerns, mounted side by side in App.jsx.
 */

const NotificationsContext = createContext(null)

export function NotificationsProvider({ children }) {
    const { user, isLoaded } = useUser()
    const { getToken } = useAuth()              // mints the JWT we pass to push.js

    // 'unsupported' | 'default' | 'granted' | 'denied'
    // Derived from the browser on mount — kept in sync by enable/disable.
    const [permission, setPermission] = useState(() => {
        if (!isNotificationSupported()) return 'unsupported'
        return getPermissionState()
    })

    // Re-sync from the browser when the user becomes known.
    // Permission can change externally (user toggles it in browser settings),
    // so we re-read on mount / remount.
    useEffect(() => {
        if (!isLoaded || !user) return
        if (!isNotificationSupported()) {
            setPermission('unsupported')
            return
        }
        setPermission(getPermissionState())
    }, [isLoaded, user])

    const enable = async () => {
        if (!user) return { ok: false, error: 'Not signed in' }
        const token = await getToken()   // session JWT — push.js sends it as Bearer
        const result = await subscribeToPush(token)
        if (result.ok) {
            setPermission('granted')
        }
        return result
    }

    const disable = async () => {
        if (!user) return { ok: false, error: 'Not signed in' }
        const token = await getToken()
        const result = await unsubscribeFromPush(token)
        if (result.ok) {
            setPermission('default')
        }
        return result
    }

    const value = {
        permission,
        isSupported: permission !== 'unsupported',
        enable,
        disable,
    }

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    )
}

/**
 * The hook: "gimme the notification state and the toggle actions."
 * Throws if used outside a NotificationsProvider (catches mistakes early).
 */
export function useNotifications() {
    const context = useContext(NotificationsContext)
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationsProvider')
    }
    return context
}
