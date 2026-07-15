import { NavLink } from 'react-router-dom'
import { Home, Calendar, Settings } from 'lucide-react'

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {children}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 flex justify-around py-3 bg-[#1a1a1a] border-t border-gray-800">

        <NavLink to ="/DashboardPage">
             <Home size={20}/>
        </NavLink>

        <NavLink to ="/upcommingPage">
            <Calendar size={20}/>
        </NavLink>

        <NavLink to="/settingsPage">
            <Settings size={20}/>
        </NavLink>


      </nav>
    </div>
  )
}

export default Layout