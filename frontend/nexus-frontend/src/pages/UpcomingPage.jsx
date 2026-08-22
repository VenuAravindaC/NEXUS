import ReminderCard from '../components/ReminderCard'

function UpcomingPage({ reminders, setReminders }) {

    // Format date for display: "Aug 22" or "Today" / "Tomorrow"
    const formatDateHeader = (dateString) => {
        const date = new Date(dateString)
        const today = new Date()
        const tomorrow = new Date()
        tomorrow.setDate(today.getDate() + 1)

        const isToday = date.toDateString() === today.toDateString()
        const isTomorrow = date.toDateString() === tomorrow.toDateString()

        if (isToday) return 'Today'
        if (isTomorrow) return 'Tomorrow'

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Filter: only future reminders (not done, not past)
    const now = new Date()
    const futureReminders = reminders
        .filter(r => !r.isDone && new Date(r.remindAt) >= now)
        .filter(r => r.type === 'time') // Only time-based reminders for now

    // Group by date (using date portion of remindAt)
    const grouped = futureReminders.reduce((acc, reminder) => {
        const date = new Date(reminder.remindAt).toISOString().split('T')[0] // "YYYY-MM-DD"
        if (!acc[date]) acc[date] = []
        acc[date].push(reminder)
        return acc
    }, {})

    // Sort dates chronologically
    const sortedDates = Object.keys(grouped).sort()

    // Sort reminders within each date by time
    Object.values(grouped).forEach(list =>
        list.sort((a, b) => new Date(a.remindAt) - new Date(b.remindAt))
    )

    const handleToggleDone = (id) => {
        setReminders(reminders.map(r =>
            r.id === id ? { ...r, isDone: !r.isDone } : r
        ))
    }

    const handleDelete = (id) => {
        setReminders(reminders.filter(r => r.id !== id))
    }

    const handleEdit = (id) => {
        // Navigate to dashboard with edit mode - or we could emit an event
        // For simplicity, navigate to dashboard where the modal already exists
        window.location.href = `/dashboard?edit=${id}`
    }

    return (
        <div className="min-h-screen pb-20 p-4 pt-8">
            <h1 className="text-2xl font-bold mb-6">Upcoming</h1>

            {futureReminders.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-32 px-8 text-center">
                    <h2 className="text-xl font-semibold mb-2">No upcoming reminders</h2>
                    <p className="text-gray-400">Create a time-based reminder to see it here</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map(dateKey => (
                        <div key={dateKey} className="space-y-3">
                            {/* Date header */}
                            <div className="flex items-center gap-2 px-2">
                                <div className="h-px flex-1 bg-gray-800" />
                                <span className="text-sm font-medium text-gray-300">
                                    {formatDateHeader(dateKey)}
                                </span>
                                <div className="h-px flex-1 bg-gray-800" />
                            </div>

                            {/* Reminders for this date */}
                            {grouped[dateKey].map(reminder => (
                                <ReminderCard
                                    key={reminder.id}
                                    reminder={reminder}
                                    onToggleDone={handleToggleDone}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default UpcomingPage