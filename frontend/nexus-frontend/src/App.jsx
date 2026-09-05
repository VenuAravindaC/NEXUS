import { BrowserRouter, Routes, Route , Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashBoardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import UpcomingPage from './pages/UpcomingPage'
import ProfilePage from './pages/ProfilePage'
import CalendarPage from './pages/CalendarPage'
import GeofenceWatcher from './components/GeofenceWatcher'
import { RemindersProvider } from './store/reminders'

function App() {
  return (
    <BrowserRouter>
      {/* Mounted ONCE, above the routes, so reminder state survives navigation */}
      <RemindersProvider>
        {/* Side-effect component: watches GPS for location reminder geofences */}
        <GeofenceWatcher />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Layout><DashBoardPage /></Layout>} />
          <Route path="/upcoming" element={<Layout><UpcomingPage /></Layout>} />
          <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
          <Route path="/settings" element={<Layout><ProfilePage /></Layout>} />
          <Route path="/" element={ <Navigate to="/login" replace />} />
        </Routes>
      </RemindersProvider>
    </BrowserRouter>
  )
}

export default App