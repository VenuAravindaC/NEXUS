import { Plus } from 'lucide-react'
import ReminderCard from '../components/ReminderCard'
import SkeletonCard from '../components/SkeletonCard'
import { useReminders } from '../store/reminders'
import { selectActiveReminders } from '../store/selectors'

/**
 * Dashboard = "today + future only" = things that need your attention.
 * Past-day reminders vanish here (Calendar keeps the full history).
 * The "what shows here" rule lives in selectors.selectActiveReminders,
 * not inlined here.
 */
function DashboardPage() {
    const { reminders, isLoading, startCreate } = useReminders()

    const sortedReminders = selectActiveReminders(reminders)

    return (
        <div className="min-h-screen pb-20">
            <div className="p-4 pt-8">
                <h1 className="text-2xl font-bold">My Reminders</h1>
            </div>

            {isLoading ? (
                // Show skeleton cards while fetching from the API
                <div className="p-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : sortedReminders.length === 0 ? (
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
                        />
                    ))}
                </div>
            )}

            {/* Floating + Button — opens the shared ReminderForm (create mode) */}
            <button
                onClick={startCreate}
                className="fixed bottom-20 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
            >
                <Plus size={24} />
            </button>
        </div>
    )
}

export default DashboardPage