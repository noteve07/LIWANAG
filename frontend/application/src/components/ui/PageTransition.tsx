import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
  key?: string;
}

/**
 * PageTransition component that provides smooth iOS-style transitions between pages
 * 
 * This component wraps page content and applies enter/exit animations based on route changes.
 * It uses React Router's useLocation hook to detect navigation events.
 */
export default function PageTransition({ children, key }: PageTransitionProps) {
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
  }, [location.pathname, key]);
  
  return (
    <div 
      className={`page-transition ${isVisible ? 'page-visible' : ''}`}
    >
      {children}
    </div>
  );
}