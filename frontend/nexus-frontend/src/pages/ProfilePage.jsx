import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/react'
import { User, LogOut, Mail, Camera, X, Check, Bell, BellOff } from 'lucide-react'
import { isNotificationSupported, getPermissionState, subscribeToPush, unsubscribeFromPush } from '../lib/push'

function ProfilePage() {
    const { user, isLoaded } = useUser()
    const { signOut } = useClerk()

    // Local edit state for the name field
    const [isEditingName, setIsEditingName] = useState(false)
    const [editName, setEditName] = useState('')

    // Push notification state: what the browser reports about permissions
    const [notifStatus, setNotifStatus] = useState('unsupported')

    // On load, read the CURRENT permission state (granted / denied / default).
    useEffect(() => {
        if (isLoaded && isNotificationSupported()) {
            setNotifStatus(getPermissionState())
        }
    }, [isLoaded])

    const handleToggleNotifications = async () => {
        if (notifStatus === 'granted') {
            const result = await unsubscribeFromPush(user.id)
            if (result.ok) setNotifStatus('default')
        } else {
            const result = await subscribeToPush(user.id)
            if (result.ok) setNotifStatus('granted')
        }
    }

    // When user loads or signs in, prefill the edit field
    useEffect(() => {
        if (isLoaded && user) {
            setEditName(user.fullName || user.firstName || '')
        }
    }, [isLoaded, user])

    const handleSaveName = async () => {
        if (!editName.trim()) return
        try {
            await user.updateProfile({ firstName: editName.trim() })
            setIsEditingName(false)
        } catch (err) {
            console.error('Failed to update name:', err)
        }
    }

    const handleCancelEdit = () => {
        setEditName(user?.fullName || user?.firstName || '')
        setIsEditingName(false)
    }

    const handleLogout = () => {
        signOut()
    }

    // Loading state (Clerk is still figuring out who's logged in)
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
        )
    }

    // Not signed in (shouldn't happen with protected routes, but safe fallback)
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400">
                Not signed in
            </div>
        )
    }

    // Fallback initials for avatar when no image
    const getInitials = (name) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <div className="min-h-screen pb-20 p-4 pt-8">
            <h1 className="text-2xl font-bold mb-8">Profile</h1>

            {/* Avatar + Name section */}
            <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-4">
                    {user.imageUrl ? (
                        <img
                            src={user.imageUrl}
                            alt={`${user.fullName || user.firstName}'s avatar`}
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-medium text-gray-300 border-2 border-gray-600">
                            {getInitials(user.fullName || user.firstName)}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 justify-center">
                    <span className="text-xl font-semibold">
                        {user.fullName || user.firstName || 'No name'}
                    </span>
                    {!isEditingName && (
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="text-gray-400 hover:text-white p-1"
                            aria-label="Edit name"
                        >
                            <Camera size={18} />
                        </button>
                    )}
                </div>

                {/* Inline name edit */}
                {isEditingName && (
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-2 text-white text-center focus:outline-none focus:border-gray-500 w-48"
                            autoFocus
                        />
                        <button
                            onClick={handleSaveName}
                            className="text-green-400 hover:text-green-300 p-1"
                            aria-label="Save name"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={handleCancelEdit}
                            className="text-gray-400 hover:text-white p-1"
                            aria-label="Cancel"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Email */}
                <p className="flex items-center gap-2 text-gray-400 mt-4">
                    <Mail size={16} />
                    <span className="text-sm">{user.primaryEmailAddress?.emailAddress || 'No email'}</span>
                </p>
            </div>

            {/* Notifications toggle (hidden if the browser can't do push) */}
                {isNotificationSupported() && (
                    <div className="max-w-md mx-auto mb-8">
                        <button
                            onClick={handleToggleNotifications}
                            className={`w-full font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                                notifStatus === 'granted'
                                    ? 'bg-[#2a2a2a] text-white border border-gray-700'
                                    : 'bg-white text-black hover:bg-gray-200'
                            }`}
                        >
                            {notifStatus === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
                            Notifications {notifStatus === 'granted' ? 'On' : 'Off'}
                        </button>
                        <p className={`text-xs text-center mt-2 ${notifStatus !== 'denied' ? 'text-gray-500' : 'text-red-400'}`}>
                            {notifStatus === 'granted'
                                ? 'Time reminders fire as system notifications.'
                                : notifStatus === 'denied'
                                    ? 'Permission blocked by the browser. Enable it in your site settings to turn notifications back on.'
                                    : 'Get notified when a reminder is due, even if NEXUS is closed.'}
                        </p>
                    </div>
                )}

                {/* Logout button */}
            <div className="max-w-md mx-auto">
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <LogOut size={20} />
                    Log out
                </button>
            </div>
        </div>
    )
}

export default ProfilePage