import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { ViewportBounds } from '../hooks/useViewportBounds';

interface ViewportTrackerProps {
  onBoundsChange: (bounds: L.LatLngBounds) => void;
}

export const ViewportTracker: React.FC<ViewportTrackerProps> = ({ onBoundsChange }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Initial bounds
    const initialBounds = map.getBounds();
    onBoundsChange(initialBounds);

    // Track viewport changes
    const handleViewportChange = () => {
      const bounds = map.getBounds();
      onBoundsChange(bounds);
    };

    // Listen to map events that change the viewport
    map.on('moveend', handleViewportChange);
    map.on('zoomend', handleViewportChange);
    map.on('resize', handleViewportChange);

    // Cleanup
    return () => {
      map.off('moveend', handleViewportChange);
      map.off('zoomend', handleViewportChange);
      map.off('resize', handleViewportChange);
    };
  }, [map, onBoundsChange]);

  return null; // This component doesn't render anything
};
