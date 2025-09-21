import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

/**
 * AnalyticsLayout serves as a wrapper for Analytics-related routes
 * This creates a nested route structure for Analytics and BarangayDetails
 * with transitions between them
 */
export default function AnalyticsLayout() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Reset animation state on route change
    setIsVisible(false);
    
    // Trigger animation after a small delay (to ensure DOM update)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return (
    <div className={`nested-transition ${isVisible ? 'nested-visible' : ''}`}>
      <Outlet />
    </div>
  );
}