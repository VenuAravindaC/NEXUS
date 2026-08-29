import { BrowserRouter, Routes, Route , Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashBoardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import UpcomingPage from './pages/UpcomingPage'
import SettingsPage from './pages/SettingsPage'
import CalendarPage from './pages/CalendarPage'
import { RemindersProvider } from './store/reminders'

function App() {
  return (
    <BrowserRouter>
      {/* Mounted ONCE, above the routes, so reminder state survives navigation */}
      <RemindersProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<Layout><DashBoardPage /></Layout>} />
          <Route path="/upcoming" element={<Layout><UpcomingPage /></Layout>} />
          <Route path="/calendar" element={<Layout><CalendarPage /></Layout>} />
          <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
          <Route path="/" element={ <Navigate to="/login" replace />} />
        </Routes>
      </RemindersProvider>
    </BrowserRouter>
  )
}

export default App