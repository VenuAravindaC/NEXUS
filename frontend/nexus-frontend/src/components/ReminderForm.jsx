import { Suspense, lazy, useEffect, useState } from 'react'
import { X, Ban } from 'lucide-react'
import { useReminders } from '../store/reminders'

// Leaflet is heavy — only pull it in when the user is actually in location mode.
const LocationPicker = lazy(() => import('./LocationPicker'))

const RADIUS_OPTIONS = [100, 250, 500, 1000]

// Convert a stored UTC ISO string into what <input type="datetime-local"> expects:
// "YYYY-MM-DDTHH:mm" expressed in the user's LOCAL time.
const toLocalInputValue = (isoString) => {
    const d = new Date(isoString)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * ReminderForm — the "create / edit reminder" deep module.
 *
 * One instance is mounted once in Layout. It watches the store's `editor`
 * door: null = closed, { mode:'create' } = blank form, { mode:'edit', id } =
 * prefilled. Any page — or a future notification's "Reschedule" — opens it
 * with startCreate() / startEdit(id). No navigation, no duplicate modals.
 *
 * Door: reads editor/reminders, knocks on addReminder / editReminder.
 */
function ReminderForm() {
    const { reminders, editor, addReminder, editReminder, stopEdit } = useReminders()

    const isOpen = editor !== null

    // Local UI state — only about the form fields, NOT the reminders themselves.
    // Whether the modal is open comes from the store's `editor` (single source of truth).
    const [reminderType, setReminderType] = useState('time')
    const [title, setTitle] = useState('')
    const [remindAt, setRemindAt] = useState('')
    const [latitude, setLatitude] = useState(null)
    const [longitude, setLongitude] = useState(null)
    const [locationName, setLocationName] = useState('')
    const [radius, setRadius] = useState(250)
    const [saveError, setSaveError] = useState('')

    // Wipe the whole form back to a blank "new time reminder".
    const resetForm = () => {
        setReminderType('time')
        setTitle('')
        setRemindAt('')
        setLatitude(null)
        setLongitude(null)
        setLocationName('')
        setRadius(250)
        setSaveError('')
    }

    // Whenever the editor door opens, prefill (edit) or blank (create).
    useEffect(() => {
        if (!isOpen) return

        if (editor.mode === 'edit') {
            const reminder = reminders.find((r) => r.id === editor.id)
            if (!reminder) return
            setReminderType(reminder.type)
            setTitle(reminder.title)
            setRemindAt(
                reminder.type === 'time' && reminder.remindAt
                    ? toLocalInputValue(reminder.remindAt)
                    : ''
            )
            setLatitude(reminder.latitude ?? null)
            setLongitude(reminder.longitude ?? null)
            setLocationName(reminder.locationName ?? '')
            setRadius(reminder.radius ?? 250)
            setSaveError('')
        } else {
            resetForm() // mode === 'create'
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor])

    const handleClose = () => {
        stopEdit() // editor → null → isOpen false → modal unmounts
        resetForm()
    }

    const handleSave = async () => {
        if (!title.trim()) return
        const isLocation = reminderType === 'location'

        // Location reminder needs a spot — check it BEFORE packing so the error
        // reads clearly (the notebook door double-checks as the safety net).
        if (isLocation && (!latitude || !longitude)) {
            setSaveError('Pick a location on the map')
            return
        }

        // Pack the envelope (read the form fields). Location reminders carry
        // no time; time reminders carry no spot — each side is null on the other.
        const reminderData = {
            title: title.trim(),
            type: reminderType,
            remindAt: isLocation ? null : new Date(remindAt).toISOString(),
            latitude: isLocation ? latitude : null,
            longitude: isLocation ? longitude : null,
            locationName: isLocation ? (locationName.trim() || 'Pinned location') : null,
            radius: isLocation ? radius : 250,
        }

        // Knock on the door — the notebook DECIDES, we just listen.
        const result = editor?.mode === 'edit'
            ? await editReminder(editor.id, reminderData)
            : await addReminder({ ...reminderData, isDone: false })

        if (!result.ok) {
            setSaveError(result.error) // the door refused — show 🚫 + message
            return
        }

        handleClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
            <div className="bg-[#1a1a1a] w-full sm:w-96 sm:rounded-lg rounded-t-2xl p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">
                        {editor?.mode === 'edit' ? 'Edit Reminder' : 'New Reminder'}
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setReminderType('time')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${reminderType === 'time' ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white'}`}
                    >
                        Time-based
                    </button>
                    <button
                        onClick={() => setReminderType('location')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${reminderType === 'location' ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white'}`}
                    >
                        Location-based
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Title Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Call dentist"
                            className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                        />
                    </div>

                    {/* Time-based Fields */}
                    {reminderType === 'time' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={remindAt}
                                onChange={(e) => { setRemindAt(e.target.value); setSaveError('') }}
                                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500"
                            />
                            {saveError && (
                                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                    <Ban size={16} />
                                    <span>{saveError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Location-based Fields */}
                    {reminderType === 'location' && (
                        <div className="space-y-4">
                            {/* The map: tap to drop a pin. */}
                            <Suspense fallback={
                                <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg h-[240px] flex items-center justify-center text-gray-400 text-sm">
                                    Loading map…
                                </div>
                            }>
                                <LocationPicker
                                    radius={radius}
                                    initialCenter={latitude && longitude ? { latitude, longitude } : null}
                                    onLocationSelect={({ latitude: lat, longitude: lng, locationName: name }) => {
                                        setLatitude(lat)
                                        setLongitude(lng)
                                        setLocationName(name)
                                        setSaveError('')
                                    }}
                                />
                            </Suspense>

                            {/* Editable name — auto-filled from the tap, user can fix it */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Location name</label>
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    placeholder="Pinned location"
                                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
                                />
                            </div>

                            {/* Radius — the geofence size */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Alert radius</label>
                                <div className="flex gap-2">
                                    {RADIUS_OPTIONS.map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setRadius(r)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${radius === r ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white'}`}
                                        >
                                            {r}m
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {saveError && (
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <Ban size={16} />
                                    <span>{saveError}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={!title.trim() || (reminderType === 'time' && !remindAt) || Boolean(saveError)}
                        className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        Save Reminder
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReminderForm