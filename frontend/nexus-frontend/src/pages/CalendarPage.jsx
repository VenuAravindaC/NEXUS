import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ReminderCard from '../components/ReminderCard'
import { useReminders } from '../store/reminders'
import { localDateKey, reminderDayKeys, selectDayReminders } from '../store/selectors'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

// Skeleton card — grey bars matching ReminderCard's shape, shown while loading
function SkeletonCard() {
    return (
        <div className="bg-[#242424] rounded-lg p-4 mb-3 animate-pulse">
            <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-700" />
                <div className="h-4 bg-gray-700 rounded w-1/2" />
                <div className="w-4 h-4 bg-gray-700 rounded ml-auto" />
            </div>
            <div className="flex items-center gap-2 mt-3 ml-9">
                <div className="h-3 bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-700 rounded w-12" />
            </div>
        </div>
    )
}

function CalendarPage() {
    const { reminders, isLoading } = useReminders()

    const today = new Date()
    const [viewYear, setViewYear] = useState(today.getFullYear())
    const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0–11
    const [selectedDate, setSelectedDate] = useState(localDateKey(today))

    // Move the view one month at a time
    const shiftMonth = (delta) => {
        const d = new Date(viewYear, viewMonth + delta, 1)
        setViewYear(d.getFullYear())
        setViewMonth(d.getMonth())
    }

    const goToday = () => {
        setViewYear(today.getFullYear())
        setViewMonth(today.getMonth())
        setSelectedDate(localDateKey(today))
    }

    // Build the month grid: leading blanks (before the 1st), then day numbers 1..N
    const leadingBlanks = new Date(viewYear, viewMonth, 1).getDay() // weekday of the 1st
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < leadingBlanks; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    // ALL time-based reminders' local day-keys — done included (history is part
    // of that day's record). Drives the little dots. Selector-owned.
    const reminderDays = reminderDayKeys(reminders)

    // Reminders shown for the selected day, earliest first. Selector-owned.
    const selectedReminders = selectDayReminders(reminders, selectedDate)

    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number)
    const selectedLabel = `${MONTHS[selMonth - 1]} ${selDay}, ${selYear}`

    return (
        <div className="min-h-screen pb-20 p-4 pt-8">
            <h1 className="text-2xl font-bold mb-6">Calendar</h1>

            {/* Month grid */}
            <section className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-4 max-w-md mx-auto w-full">
                {/* Month header */}
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => shiftMonth(-1)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="text-center">
                        <h2 className="text-lg font-semibold">{MONTHS[viewMonth]} {viewYear}</h2>
                        <button onClick={goToday} className="text-xs text-gray-400 hover:text-white mt-0.5">
                            Today
                        </button>
                    </div>

                    <button
                        onClick={() => shiftMonth(1)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded-lg"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Weekday labels */}
                <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-1">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="py-1">{day}</div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, index) => {
                        if (day === null) return <div key={`blank-${index}`} />

                        const dayKey = localDateKey(new Date(viewYear, viewMonth, day))
                        const isTodayCell =
                            viewYear === today.getFullYear() &&
                            viewMonth === today.getMonth() &&
                            day === today.getDate()
                        const isSelected = selectedDate === dayKey
                        const hasReminders = reminderDays.has(dayKey)

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(dayKey)}
                                className={`relative aspect-square rounded-full flex items-center justify-center text-sm transition-colors ${
                                    isTodayCell
                                        ? 'bg-white text-black font-semibold'
                                        : isSelected
                                            ? 'bg-[#333333] text-white ring-1 ring-gray-500'
                                            : 'text-white hover:bg-[#2a2a2a]'
                                }`}
                            >
                                {day}
                                {hasReminders && (
                                    <span
                                        className={`absolute bottom-1.5 w-1 h-1 rounded-full ${isTodayCell ? 'bg-black' : 'bg-gray-400'}`}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* Dropdown for the selected day */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-lg font-semibold">{selectedLabel}</h2>
                    <span className="text-sm text-gray-400">
                        {selectedReminders.length} {selectedReminders.length === 1 ? 'reminder' : 'reminders'}
                    </span>
                </div>

                {isLoading ? (
                    <SkeletonCard />
                ) : selectedReminders.length === 0 ? (
                    <div className="bg-[#242424] rounded-lg p-6 text-center text-gray-400 text-sm">
                        No reminders on this day
                    </div>
                ) : (
                    selectedReminders.map(reminder => (
                        <ReminderCard
                            key={reminder.id}
                            reminder={reminder}
                        />
                    ))
                )}
            </section>
        </div>
    )
}

export default CalendarPage