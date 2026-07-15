import { BrowserRouter, Routes, Route , Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashBoardPage from './pages/DashboardPage'
import Layout from './components/Layout'
import UpcomingPage from './pages/UpcomingPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Layout><DashBoardPage /></Layout>} />
        <Route path="/upcoming" element={<Layout><UpcomingPage /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        <Route path="/" element={ <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App