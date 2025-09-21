import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Lightbulb, Server, BarChart3, Bot } from 'lucide-react';

function Header() {
  return (
    <header className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-300">LIWANAG</h1>
        <div className="flex items-center space-x-4">
          <span>Welcome, Admin</span>
          <button className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="bg-gray-800 text-white w-64 h-screen overflow-y-auto">
      <nav className="p-4">
        <div className="mb-6"> 
          <h2 className="text-xl font-bold text-yellow-500">Menu</h2>
        </div>
        
        <ul className="space-y-2">
          <li>
            <NavLink to="/dashboard" className={({isActive}) => 
              isActive ? "flex items-center p-2 bg-blue-600 rounded-md" : "flex items-center p-2 hover:bg-gray-700 rounded-md"
            }>
              <LayoutDashboard className="mr-3" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/streetIllumination" className={({isActive}) => 
              isActive ? "flex items-center p-2 bg-blue-600 rounded-md" : "flex items-center p-2 hover:bg-gray-700 rounded-md"
            }>
              <Lightbulb className="mr-3" />
              Street Illumination
            </NavLink>
          </li>
          <li>
            <NavLink to="/deviceManager" className={({isActive}) => 
              isActive ? "flex items-center p-2 bg-blue-600 rounded-md" : "flex items-center p-2 hover:bg-gray-700 rounded-md"
            }>
              <Server className="mr-3" />
              Device Manager
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({isActive}) => 
              isActive ? "flex items-center p-2 bg-blue-600 rounded-md" : "flex items-center p-2 hover:bg-gray-700 rounded-md"
            }>
              <BarChart3 className="mr-3" />
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink to="/luxor" className={({isActive}) => 
              isActive ? "flex items-center p-2 bg-blue-600 rounded-md" : "flex items-center p-2 hover:bg-gray-700 rounded-md"
            }>
              <Bot className="mr-3" />
              Luxor
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export { Header, Sidebar };