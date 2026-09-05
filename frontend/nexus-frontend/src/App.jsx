import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import LoginPage from './pages/LoginPage'
import DashBoardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import UpcomingPage from './pages/UpcomingPage'
import ProfilePage from './pages/ProfilePage'
import CalendarPage from './pages/CalendarPage'
import GeofenceWatcher from './components/GeofenceWatcher'
import { RemindersProvider } from './store/reminders'
import { NotificationsProvider } from './store/notifications'

/**
 * Route guard: if the user isn't signed in, redirect to /login.
 * Clerk's useAuth gives us isLoaded + isSignedIn — we show a spinner
 * while Clerk is still figuring out auth state (avoids flashing the login
 * page on a logged-in user), then redirect if not signed in.
 */
function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth()
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    )
  }
  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter>
      {/* Mounted ONCE, above the routes, so reminder state survives navigation */}
      <RemindersProvider>
        {/* Owns the single source of truth for notification permission */}
        <NotificationsProvider>
          {/* Side-effect component: watches GPS for location reminder geofences */}
          <GeofenceWatcher />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected routes — only accessible when signed in.
                RequireAuth redirects to /login if not authenticated. */}
            <Route path="/dashboard" element={<RequireAuth><Layout><DashBoardPage /></Layout></RequireAuth>} />
            <Route path="/upcoming" element={<RequireAuth><Layout><UpcomingPage /></Layout></RequireAuth>} />
            <Route path="/calendar" element={<RequireAuth><Layout><CalendarPage /></Layout></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Layout><ProfilePage /></Layout></RequireAuth>} />
          </Routes>
        </NotificationsProvider>
      </RemindersProvider>
    </BrowserRouter>
  )
}

export default App