import { NavLink } from 'react-router-dom'
import { Home, Calendar, Settings } from 'lucide-react'
import { useState , cloneElement } from 'react'

function Layout({ children }) {

  const [ reminders , setReminders ] = useState([])/**
   * Reminder shape:
   * {
   *   id: string,
   *   title: string,
   *   type: "time" | "location",
   *   remindAt: string | null,          // UTC timestamp for time-based
   *   latitude: number | null,          // for location-based
   *   longitude: number | null,         // for location-based
   *   locationName: string | null,      // display name for location
   *   radius: number,                   // meters, default 250
   *   isDone: boolean,
   *   createdAt: string                 // UTC timestamp
   * }
   */

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {cloneElement(children, { reminders, setReminders })}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-3 bg-[#1a1a1a] border-t border-gray-800">

        <NavLink to ="/dashboard">
             <Home size={20}/>
        </NavLink>

        <NavLink to ="/upcoming">
            <Calendar size={20}/>
        </NavLink>

        <NavLink to="/settings">
            <Settings size={20}/>
        </NavLink>


      </nav>
    </div>
  )
}

export default Layout