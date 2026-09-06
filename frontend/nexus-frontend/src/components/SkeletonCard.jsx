/**
 * SkeletonCard.jsx — the loading placeholder that matches ReminderCard's shape.
 *
 * While reminders fetch from the API, pages show a few of these grey "bars"
 * so the layout doesn't jump when real cards replace them. The dimensions
 * mirror ReminderCard's content: an icon circle, a title line, and a
 * meta row — all as non-blocking pulse bars.
 *
 * Shared by Dashboard, Upcoming, and Calendar (each used to own a copy).
 */
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

export default SkeletonCard