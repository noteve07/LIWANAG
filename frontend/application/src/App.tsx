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

import { useState, useEffect } from 'react';
import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import Dashboard from './Pages/Dashboard/Dashboard';
import DeviceManager from './Pages/DeviceManager/DeviceManager';
import Analytics from './Pages/Analytics/Analytics';
import BarangayDetails from './Pages/Analytics/BarangayDetails';
import Luxor from './Pages/Luxor';
import StreetIllumination from './Pages/StreetIllumination';
import RootLayout from './RouteLayout/RootLayout';
import AnalyticsLayout from './RouteLayout/AnalyticsLayout';
import Error404 from './Pages/Error404';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 3 seconds on every refresh
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<RootLayout />}>
        <Route index element={<Dashboard />} />
        <Route path='dashboard' element={<Dashboard />} />
        <Route path='deviceManager' element={<DeviceManager />} />
        <Route path='analytics' element={<AnalyticsLayout />}>
          <Route index element={<Analytics />} />
          <Route path=':barangayName' element={<BarangayDetails />} />
        </Route>
        <Route path='luxor' element={<Luxor />} />
        <Route path='streetIllumination' element={<StreetIllumination />} /> 
        <Route path='error' element={<Error404 />} /> 
        <Route path='*' element={<Error404 />} /> 
      </Route>
    )
  )

  // Show loading screen for 3 seconds, then show the app
  if (isLoading) {
    return <LoadingScreen />;
  }

  return <RouterProvider router={router} />;
}

export default App;
