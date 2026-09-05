/**
 * NotificationPrompt.jsx — proactive "enable notifications?" banner.
 *
 * Shown when the user opens CUE and the browser's notification permission
 * is still 'default' (never asked). This matches the mobile pattern: apps
 * ask permission at a natural moment, not buried in settings.
 *
 * Key constraints:
 *   1. Browsers require a user gesture (click) to show the permission prompt.
 *      We can't prompt on page load — we show a banner and wait for a click.
 *   2. Don't nag. If the user dismisses this, remember in localStorage and
 *      don't show again until the browser permission is reset or the app is
 *      reinstalled.
 *   3. Subtle, not blocking. A banner at the top, not a modal.
 *
 * Mounted inside Layout, above NotificationBanner.
 */

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useUser } from '@clerk/react'
import { isNotificationSupported, subscribeToPush } from '../lib/push'

const DISMISSED_KEY = 'cue-notif-prompt-dismissed'

function NotificationPrompt() {
    const { user, isLoaded } = useUser()
    // 'hidden' = don't show (dismissed, unsupported, or already granted)
    // 'idle'   = banner visible, waiting for user to click Enable
    // 'loading'= subscribing in progress
    // 'success'= subscription succeeded, auto-dismiss in 3s
    // 'error'  = subscription failed, show error briefly
    const [status, setStatus] = useState('hidden')

    useEffect(() => {
        if (!isLoaded || !user) return

        // If permission already granted or denied — nothing to prompt.
        if (!isNotificationSupported()) return
        const perm = Notification.permission
        if (perm !== 'default') return

        // If user dismissed this prompt before — don't nag.
        try {
            if (localStorage.getItem(DISMISSED_KEY) === '1') return
        } catch {
            // localStorage unavailable (private browsing) — show prompt anyway
        }

        setStatus('idle')
    }, [isLoaded, user])

    // After success, auto-dismiss the banner after 3 seconds.
    useEffect(() => {
        if (status !== 'success') return
        const t = setTimeout(() => setStatus('hidden'), 3_000)
        return () => clearTimeout(t)
    }, [status])

    const handleEnable = async () => {
        setStatus('loading')
        const result = await subscribeToPush(user.id)
        if (result.ok) {
            setStatus('success')
        } else {
            setStatus('error')
            // Auto-clear the error after 4 seconds.
            setTimeout(() => setStatus('hidden'), 4_000)
        }
    }

    const handleDismiss = () => {
        setStatus('hidden')
        try {
            localStorage.setItem(DISMISSED_KEY, '1')
        } catch { /* ignore */ }
    }

    // Not visible — render nothing.
    if (status === 'hidden' || status === 'success') {
        return status === 'success' ? (
            <div className="bg-[#16a34a]/15 border border-[#16a34a]/30 px-4 py-3 text-center text-sm text-[#4ade80] animate-slideDown">
                Notifications enabled — you'll be notified when a reminder is due.
            </div>
        ) : null
    }

    return (
        <div className="bg-[#2a2a2a] border-b border-gray-700 px-4 py-3 flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-3">
                <Bell size={18} className="text-gray-300 shrink-0" />
                <div>
                    <p className="text-sm font-medium text-white">Get notified when a reminder is due</p>
                    <p className="text-xs text-gray-400">You'll get a system notification even if CUE is closed.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
                <button
                    onClick={handleEnable}
                    disabled={status === 'loading'}
                    className="text-sm font-medium bg-white text-black px-4 py-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? 'Enabling…' : 'Enable'}
                </button>
                <button
                    onClick={handleDismiss}
                    className="text-gray-500 hover:text-white p-1"
                    aria-label="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
            {status === 'error' && (
                <p className="absolute left-0 right-0 -bottom-6 text-xs text-center text-red-400">
                    Notifications are blocked by the browser. Check your site settings.
                </p>
            )}
        </div>
    )
}

export default NotificationPrompt
