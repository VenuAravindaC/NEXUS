import { NavLink } from 'react-router-dom'
import { Home, Clock, Calendar, User } from 'lucide-react'

// Pure layout: just renders its child page + the bottom nav.
// No state here anymore — reminder data lives in the store (useReminders).
function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>

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