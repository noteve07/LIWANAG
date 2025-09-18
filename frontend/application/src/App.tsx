/**
 * Main Routing Configuration
 * 
 * This file contains all the route and path definitions for the LIWANAG application.
 * It uses React Router v6 with the createBrowserRouter API to define the routing structure.
 * 
 * The routing follows a nested pattern where:
 * - RootLayout serves as the parent layout component with persistent UI elements
 * - Child routes render within the <Outlet /> component in RootLayout
 */

import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import Dashboard from './Pages/Dashboard';
import DeviceManager from './Pages/DeviceManager';
import Analytics from './Pages/Analytics';
import Luxor from './Pages/Luxor';
import StreetIllumination from './Pages/StreetIllumination';
import RootLayout from './RouteLayout/RootLayout';

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path='dashboard' element={<Dashboard />} />
        <Route path='deviceManager' element={<DeviceManager />} />
        <Route path='analytics' element={<Analytics />} />
        <Route path='luxor' element={<Luxor />} />
        <Route path='streetIllumination' element={<StreetIllumination />} /> 
        <Route path='*' element={<div className="p-10 text-center text-2xl text-gray-500">404 Not Found</div>} />
      </Route>
    )
  )

  return <RouterProvider router={router} />;
}

export default App;
