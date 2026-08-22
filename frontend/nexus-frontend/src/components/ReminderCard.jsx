import { Check, MoreVertical } from 'lucide-react'
import { useState } from 'react'

function ReminderCard({ reminder, onToggleDone, onEdit, onDelete }) {
    const [menuOpen, setMenuOpen] = useState(false)

    const formatDate = (isoString) => {
        const date = new Date(isoString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    }

    return (
        <div className="bg-[#242424] rounded-lg p-4 mb-3">
            {/* Top row: Checkbox | Title | Menu */}
            <div className="flex items-center gap-3">
                {/* Checkbox */}
                <button
                    onClick={() => onToggleDone(reminder.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        reminder.isDone
                            ? 'bg-white border-white'
                            : 'border-gray-500 hover:border-gray-400'
                    }`}
                >
                    {reminder.isDone && <Check size={14} className="text-black" />}
                </button>

                {/* Title */}
                <span className={`flex-1 ${reminder.isDone ? 'line-through text-gray-500' : ''}`}>
                    {reminder.title}
                </span>

                {/* 3-dot menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-gray-400 hover:text-white p-1"
                    >
                        <MoreVertical size={18} />
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div className="absolute right-0 top-8 bg-[#2a2a2a] rounded-lg shadow-lg py-1 min-w-[100px] z-10">
                            <button
                                onClick={() => {
                                    onEdit(reminder.id)
                                    setMenuOpen(false)
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-[#3a3a3a]"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => {
                                    onDelete(reminder.id)
                                    setMenuOpen(false)
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#3a3a3a]"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom row: Date/Location | Type badge */}
            <div className="flex items-center gap-2 mt-2 ml-9">
                {/* Date/Time or Location */}
                <span className="text-sm text-gray-400">
                    {reminder.type === 'time'
                        ? formatDate(reminder.remindAt)
                        : reminder.locationName || 'Location not set'}
                </span>

                {/* Type badge */}
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    {reminder.type === 'time' ? 'Time' : 'Location'}
                </span>
            </div>
        </div>
    )
}

export default ReminderCard
