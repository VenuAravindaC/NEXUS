import { Plus, X, Ban } from 'lucide-react'
import { Suspense, lazy, useEffect, useState } from 'react'
import ReminderCard from '../components/ReminderCard'
import { useReminders } from '../store/reminders'

// Leaflet is heavy — only pull it in when the user is actually in location mode.
const LocationPicker = lazy(() => import('../components/LocationPicker'))

const RADIUS_OPTIONS = [100, 250, 500, 1000]

function DashboardPage() {
    const { reminders, editingId, addReminder, toggleDone, editReminder, deleteReminder, startEdit, stopEdit } = useReminders()

    // Local UI state — only about the modal form, NOT the reminders themselves.
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [reminderType, setReminderType] = useState('time')
    const [title, setTitle] = useState('')
    const [remindAt, setRemindAt] = useState('')
    const [latitude, setLatitude] = useState(null)
    const [longitude, setLongitude] = useState(null)
    const [locationName, setLocationName] = useState('')
    const [radius, setRadius] = useState(250)
    const [saveError, setSaveError] = useState('')

    // Convert a stored UTC ISO string into what <input type="datetime-local"> expects:
    // "YYYY-MM-DDTHH:mm" expressed in the user's LOCAL time.
    const toLocalInputValue = (isoString) => {
        const d = new Date(isoString)
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const editingReminder = reminders.find(r => r.id === editingId) ?? null

    // Dashboard = "today + future only" = things that need your attention.
    // Past-day reminders vanish here (Calendar keeps the full history).
    // Location reminders always show — they have no date to expire.
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const activeReminders = reminders.filter(r => {
        if (r.type === 'location') return true
        if (!r.remindAt) return true
        return new Date(r.remindAt) >= todayStart
    })

    // Display rule: newest created first. The notebook keeps insert order;
    // the PAGE decides how to present it. (Upcoming/Calendar order it differently.)
    const sortedReminders = [...activeReminders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Whenever editingId changes (e.g. we navigated here from Upcoming after startEdit),
    // pre-fill the form with that reminder and open the modal.
    useEffect(() => {
        if (editingReminder) {
            setReminderType(editingReminder.type)
            setTitle(editingReminder.title)
            setRemindAt(
                editingReminder.type === 'time' && editingReminder.remindAt
                    ? toLocalInputValue(editingReminder.remindAt)
                    : ''
            )
            setLatitude(editingReminder.latitude ?? null)
            setLongitude(editingReminder.longitude ?? null)
            setLocationName(editingReminder.locationName ?? '')
            setRadius(editingReminder.radius ?? 250)
            setIsModalOpen(true)
        }
    }, [editingReminder])

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

    const openNewModal = () => {
        stopEdit() // make sure we're not editing anything
        resetForm()
        setIsModalOpen(true)
    }

    const closeModal = () => {
        stopEdit()
        setIsModalOpen(false)
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

        // Knock on the door — the notebook DECIDES, we just listen
        // await because addReminder/editReminder are now async (they call the API)
        const result = await (editingId
            ? editReminder(editingId, reminderData)
            : addReminder({
                ...reminderData,
                isDone: false,
            }))

        if (!result.ok) {
            setSaveError(result.error) // the door refused — show 🚫 + message
            return
        }

        closeModal()
    }

    const handleEdit = (id) => {
        // Tell the notebook "reminder id is being edited" — the effect above
        // will pre-fill the form and open the modal for us.
        startEdit(id)
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="p-4 pt-8">
                <h1 className="text-2xl font-bold">My Reminders</h1>
            </div>

            {sortedReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-32 px-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">No reminders yet</h2>
                    <p className="text-gray-400">Tap the + button to create your first reminder</p>
                </div>
            ) : (
                <div className="p-4">
                    {sortedReminders.map(reminder => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onToggleDone={() => toggleDone(reminder.id)}
                            onEdit={handleEdit}
                            onDelete={() => deleteReminder(reminder.id)}
                        />
                    ))}
                </div>
            )}

            {/* Floating + Button */}
            <button
                onClick={openNewModal}
                className="fixed bottom-20 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
            >
                <Plus size={24} />
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50">
                    <div className="bg-[#1a1a1a] w-full sm:w-96 sm:rounded-lg rounded-t-2xl p-6">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold">
                                {editingId ? 'Edit Reminder' : 'New Reminder'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white">
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
                                    {/* The map: deep module — tap to drop a pin.
                                        Lazy-loaded so Leaflet only downloads in location mode. */}
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
            )}
        </div>
    )
}

export default DashboardPage
