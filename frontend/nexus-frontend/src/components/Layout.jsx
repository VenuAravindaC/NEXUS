import { NavLink } from 'react-router-dom'
import { Home, Clock, Calendar, User } from 'lucide-react'
import ReminderForm from './ReminderForm'
import NotificationBanner from './NotificationBanner'

// Pure layout: renders its child page + the bottom nav.
// ReminderForm is mounted HERE, once, so any page — or a future push
// notification's "Reschedule" — can open the editor from anywhere.
// NotificationBanner sits above everything: it shows push + geofence alerts
// when the app is open.
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationBanner />
      <div className="flex-1">
        {children}
      </div>
      <ReminderForm />

      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-3 bg-[#1a1a1a] border-t border-gray-800">

        <NavLink to ="/dashboard">
             <Home size={20}/>
        </NavLink>

        <NavLink to ="/upcoming">
            <Clock size={20}/>
        </NavLink>

        <NavLink to ="/calendar">
            <Calendar size={20}/>
        </NavLink>

        <NavLink to="/settings">
            <User size={20}/>
        </NavLink>


      </nav>
    </div>
  )
}

export default Layout