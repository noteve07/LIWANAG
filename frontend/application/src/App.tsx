import {Header, Sidebar} from './AppLayout';
import { Routes, Route } from 'react-router-dom'
import Dashboard from './Pages/Dashboard';
import DeviceManager from './Pages/DeviceManager';
import Analytics from './Pages/Analytics';
import Luxor from './Pages/Luxor';
import StreetIllumination from './Pages/StreetIllumination';

function App() {
  
  return (
  <div className="min-h-screen bg-[#070B13] overflow-x-hidden">
    <div className="min-h-screen bg-gradient-to-br from-yellow-900/40 via-transparent to-yellow-900/20">
      <div className="flex overflow-x-hidden min-h-screen">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 bg-gradient-to-br from-blue-900/20 via-transparent to-purple-900/30 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/deviceManager" element={<DeviceManager />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/luxor" element={<Luxor />} />
              <Route path="/streetIllumination" element={<StreetIllumination />} />
              <Route path="*" element={<div className="p-10 text-center text-2xl text-gray-500">404 Not Found</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;
