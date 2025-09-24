import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Lightbulb, Server, BarChart3, Bot, Bell, Mail, User, Search } from 'lucide-react';

function Header() {
  return (
  <header className="bg-[#151E2A]/95 backdrop-blur-sm text-white px-6 py-3 shadow-2xl border-b border-slate-700/50">
      <div className="w-full flex justify-between items-center">
        {/* Left - Official Branding */}
<<<<<<< Updated upstream
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-sm text-gray-300 font-medium">Lighting Intelligence with Automated Navigation for Analytics and Governance</span>
          </div>
=======
 <div className="flex items-center space-x-3">
            <div className="h-8 w-px bg-slate-600"></div>
          </div>
          <div className="flex flex-col">
              <span className="text-sm text-gray-300 font-medium">Lighting Intelligence with Automated Navigation for Analytics and Governance</span>
>>>>>>> Stashed changes
        </div>
        
        {/* Right - User Actions */}
        <div className="flex items-center space-x-6">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-300 font-medium">System Online</span>
          </div>
          
          {/* Utility Icons */}
          <div className="flex items-center space-x-1 bg-slate-800/30 rounded-full p-1">
            <button className="p-2.5 hover:bg-yellow-400/20 rounded-full transition-all duration-200 group relative">
              <Bell size={18} className="text-gray-300 group-hover:text-amber-300 transition-colors" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
            </button>
            
            <button className="p-2.5 hover:bg-yellow-400/20 rounded-full transition-all duration-200 group">
              <Mail size={18} className="text-gray-300 group-hover:text-amber-300 transition-colors" />
            </button>
            
            <div className="w-px h-6 bg-slate-600 mx-1"></div>
            
            <button className="flex items-center space-x-2 p-2 hover:bg-yellow-400/20 rounded-full transition-all duration-200 group">
              <User size={18} className="text-gray-300 group-hover:text-amber-300 transition-colors" />
              <span className="text-sm text-gray-300 group-hover:text-white pr-1">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar() {
  return (
    <>
      <style>{`
        @keyframes lightPulse {
          0% { opacity: 0.4; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
      <aside className="w-72 h-full overflow-y-auto bg-gradient-to-b from-[#151E2A] via-[#141b26] to-[#131821] border-r border-slate-700/60 shadow-2xl flex flex-col">
      {/* LIWANAG Logo and App Name */}
      <div className="px-6 py-6">
        <div className="flex items-center group">
          <div className="relative">
            <Lightbulb
              size={42}
              className="mr-4 text-amber-300 drop-shadow-[0_0_12px_#fbbf24] group-hover:drop-shadow-[0_0_20px_#fbbf24] transition-all duration-300"
              strokeWidth={2.2}
              style={{ 
                animation: 'lightPulse 3s ease-in-out infinite',
                animationTimingFunction: 'cubic-bezier(0.25, 0, 0.75, 1)'
              }}
            />
            <div className="absolute inset-0 bg-amber-300/20 blur-xl rounded-full" style={{ 
              animation: 'lightPulse 3s ease-in-out infinite',
              animationTimingFunction: 'cubic-bezier(0.25, 0, 0.75, 1)'
            }}></div>
          </div>
          <h1 className="text-2xl font-bold text-amber-300 tracking-wide">LIWANAG</h1>
        </div>
      </div>
      
      <nav className="flex-1 flex flex-col px-4 pb-6">
        <ul className="space-y-1 flex-1 mt-4">
          <li>
            <NavLink to="/dashboard" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 mx-2 px-4 py-3 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 text-yellow-100 rounded-xl shadow-lg border-l-4 border-yellow-400 font-medium transition-all duration-200 transform scale-[1.02]"
                : "flex items-center gap-3 mx-2 px-4 py-3 text-gray-300 hover:bg-gradient-to-r hover:from-slate-700/40 hover:to-slate-600/20 hover:text-white rounded-xl transition-all duration-200 hover:transform hover:translate-x-1"
            }>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/streetIllumination" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 mx-2 px-4 py-3 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 text-yellow-100 rounded-xl shadow-lg border-l-4 border-yellow-400 font-medium transition-all duration-200 transform scale-[1.02]"
                : "flex items-center gap-3 mx-2 px-4 py-3 text-gray-300 hover:bg-gradient-to-r hover:from-slate-700/40 hover:to-slate-600/20 hover:text-white rounded-xl transition-all duration-200 hover:transform hover:translate-x-1"
            }>
              <Lightbulb className="w-5 h-5" />
              Street Illumination
            </NavLink>
          </li>
          <li>
            <NavLink to="/deviceManager" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 mx-2 px-4 py-3 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 text-yellow-100 rounded-xl shadow-lg border-l-4 border-yellow-400 font-medium transition-all duration-200 transform scale-[1.02]"
                : "flex items-center gap-3 mx-2 px-4 py-3 text-gray-300 hover:bg-gradient-to-r hover:from-slate-700/40 hover:to-slate-600/20 hover:text-white rounded-xl transition-all duration-200 hover:transform hover:translate-x-1"
            }>
              <Server className="w-5 h-5" />
              Device Manager
            </NavLink>
          </li>
          <li>
            <NavLink to="/analytics" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 mx-2 px-4 py-3 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 text-yellow-100 rounded-xl shadow-lg border-l-4 border-yellow-400 font-medium transition-all duration-200 transform scale-[1.02]"
                : "flex items-center gap-3 mx-2 px-4 py-3 text-gray-300 hover:bg-gradient-to-r hover:from-slate-700/40 hover:to-slate-600/20 hover:text-white rounded-xl transition-all duration-200 hover:transform hover:translate-x-1"
            }>
              <BarChart3 className="w-5 h-5" />
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink to="/luxor" className={({isActive}) => 
              isActive
                ? "flex items-center gap-3 mx-2 px-4 py-3 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 text-yellow-100 rounded-xl shadow-lg border-l-4 border-yellow-400 font-medium transition-all duration-200 transform scale-[1.02]"
                : "flex items-center gap-3 mx-2 px-4 py-3 text-gray-300 hover:bg-gradient-to-r hover:from-slate-700/40 hover:to-slate-600/20 hover:text-white rounded-xl transition-all duration-200 hover:transform hover:translate-x-1"
            }>
              <Bot className="w-5 h-5" />
              Luxor
            </NavLink>
          </li>
        </ul>
              </nav>
              
              {/* Bottom Section - Footer */}
              <div className="px-4 pb-4">
                {/* Footer Links - 2 per row */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <a href="#" className="text-gray-500 hover:text-amber-300 transition-colors py-1 text-center">
                    About LIWANAG
                  </a>
                  <a href="#" className="text-gray-500 hover:text-amber-300 transition-colors py-1 text-center">
                    Documentation
                  </a>
                  <a href="#" className="text-gray-500 hover:text-amber-300 transition-colors py-1 text-center">
                    Contact Support
                  </a>
                  <a href="#" className="text-gray-500 hover:text-amber-300 transition-colors py-1 text-center">
                    Privacy Policy
                  </a>
                </div>
                
                {/* Copyright with Version */}
                <div className="pt-3 border-t border-slate-700/30 mt-3">
                  <p className="text-xs text-gray-500 text-center">
                    © 2025 LIWANAG Dev Team (v1.1.0)
                  </p>
                </div>
              </div>
            </aside>
    </>
  );
}

export { Header, Sidebar };