import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Lightbulb, Server, BarChart3, Bot } from 'lucide-react';

function Header() {
  return (
  <header className="bg-gradient-to-r from-[#13172e] via-[#1a1a2e] to-[#13172e#13172e] text-white px-5 py-5 shadow-xl border-b border-blue-900/50">
      <div className="w-full max-w-full flex justify-between items-center">
        <div className="flex items-center ml-8">
          {/* Modern Lightbulb Logo */}
          <Lightbulb
            size={40}
            className="mr-3 text-yellow-300 drop-shadow-[0_0_8px_#ffe066]"
            strokeWidth={2.2}
          />
          <span className="absolute w-fit bg-yellow-300/30 blur-xl text-2xl font-bold text-transparent">
             LIWANAG
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-yellow-300">
              LIWANAG
          </h1>
        </div>

        <p className="text-md text-yellow-400/70 hidden sm:block">Lightning Intelligence With Automated Navigation for Analytics & Governance</p>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/*Profile logo or use BPSU logo and Balanga City Logo*/}
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <aside className="w-64 h-screen overflow-y-auto bg-gradient-to-b from-[#181c33] via-[#0c0c3b] to-[#19243f] border-r border-blue-900/40 shadow-xl rounded-tr-2xl rounded-br-2xl flex flex-col">
      <nav className="flex-1 flex flex-col p-6">
        <div className="mb-6 flex flex-col items-start">
          <h2 className="text-2xl font-extrabold text-yellow-400 tracking-wide mb-2">Menu</h2>
          <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 rounded-full mb-2" />
        </div>
        <ul className="space-y-2 flex-1">
          <li>
            <NavLink to="/dashboard" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 p-3 bg-blue-700/70 text-white rounded-lg shadow-md border-l-4 border-yellow-400 font-semibold transition-all duration-150"
                : "flex items-center gap-3 p-3 text-white hover:bg-blue-900/40 hover:text-yellow-200 rounded-lg transition-all duration-150"
            }>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/streetIllumination" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 p-3 bg-blue-700/70 text-white rounded-lg shadow-md border-l-4 border-yellow-400 font-semibold transition-all duration-150"
                : "flex items-center gap-3 p-3 text-white hover:bg-blue-900/40 hover:text-yellow-200 rounded-lg transition-all duration-150"
            }>
              <Lightbulb className="w-5 h-5" />
              Street Illumination
            </NavLink>
          </li>
          <li>
            <NavLink to="/deviceManager" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 p-3 bg-blue-700/70 text-white rounded-lg shadow-md border-l-4 border-yellow-400 font-semibold transition-all duration-150"
                : "flex items-center gap-3 p-3 text-white hover:bg-blue-900/40 hover:text-yellow-200 rounded-lg transition-all duration-150"
            }>
              <Server className="w-5 h-5" />
              Device Manager
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 p-3 bg-blue-700/70 text-white rounded-lg shadow-md border-l-4 border-yellow-400 font-semibold transition-all duration-150"
                : "flex items-center gap-3 p-3 text-white hover:bg-blue-900/40 hover:text-yellow-200 rounded-lg transition-all duration-150"
            }>
              <BarChart3 className="w-5 h-5" />
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink to="/luxor" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 p-3 bg-blue-700/70 text-white rounded-lg shadow-md border-l-4 border-yellow-400 font-semibold transition-all duration-150"
                : "flex items-center gap-3 p-3 text-white hover:bg-blue-900/40 hover:text-yellow-200 rounded-lg transition-all duration-150"
            }>
              <Bot className="w-5 h-5" />
              Luxor
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export { Header, Sidebar };