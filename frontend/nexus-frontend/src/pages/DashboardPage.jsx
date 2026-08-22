import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import ReminderCard from '../components/ReminderCard'

function DashboardPage({ reminders, setReminders }) {

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [reminderType, setReminderType] = useState('time')
    const [title, setTitle] = useState('')
    const [remindAt, setRemindAt] = useState('')

    // Convert a stored UTC ISO string into what <input type="datetime-local"> expects:
    // "YYYY-MM-DDTHH:mm" expressed in the user's LOCAL time.
    const toLocalInputValue = (isoString) => {
        const d = new Date(isoString)
        const pad = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }

    const openModal = () => setIsModalOpen(true)
    const closeModal = () => {
        setIsModalOpen(false)
        setEditingId(null)
        setReminderType('time')
        setTitle('')
        setRemindAt('')
    }

    const handleSave = () => {
        if (!title.trim()) return

        if (editingId) {
            // EDIT MODE: update the existing reminder
            setReminders(reminders.map(r =>
                r.id === editingId
                    ? {
                        ...r,
                        title: title.trim(),
                        type: reminderType,
                        remindAt: reminderType === 'time' ? new Date(remindAt).toISOString() : null
                    }
                    : r
            ))
        } else {
            // CREATE MODE: add a new reminder
            const newReminder = {
                id: Date.now().toString(),
                title: title.trim(),
                type: reminderType,
                remindAt: reminderType === 'time' ? new Date(remindAt).toISOString() : null,
                latitude: null,
                longitude: null,
                locationName: null,
                radius: 250,
                isDone: false,
                createdAt: new Date().toISOString()
            }
            setReminders([...reminders, newReminder])
        }

        closeModal()
    }

    const handleToggleDone = (id) => {
        setReminders(reminders.map(r =>
            r.id === id ? { ...r, isDone: !r.isDone } : r
        ))
    }

    const handleDelete = (id) => {
        setReminders(reminders.filter(r => r.id !== id))
    }

    const handleEdit = (id) => {
        const reminder = reminders.find(r => r.id === id)
        if (!reminder) return // Guard: reminder was deleted

        // Pre-fill form fields
        setEditingId(id)
        setReminderType(reminder.type)
        setTitle(reminder.title)
        if (reminder.type === 'time' && reminder.remindAt) {
            setRemindAt(toLocalInputValue(reminder.remindAt))
        }

        setIsModalOpen(true)
    }

    return (
        <div className="min-h-screen pb-20">
            <div className="p-4 pt-8">
                <h1 className="text-2xl font-bold">My Reminders</h1>
            </div>

            {reminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-32 px-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">No reminders yet</h2>
                    <p className="text-gray-400">Tap the + button to create your first reminder</p>
                </div>
            ) : (
                <div className="p-4">
                    {reminders.map(reminder => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                            onToggleDone={handleToggleDone}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Floating + Button */}
            <button
                onClick={openModal}
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
                                        onChange={(e) => setRemindAt(e.target.value)}
                                        className="w-full bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500"
                                    />
                                </div>
                            )}

                            {/* Location-based Fields (placeholder for now) */}
                            {reminderType === 'location' && (
                                <div className="bg-[#2a2a2a] border border-gray-700 rounded-lg px-4 py-8 text-center text-gray-400">
                                    Map picker will go here (Day 5)
                                </div>
                            )}

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={!title.trim()}
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