import { useEffect } from "react";
import { useMap } from "react-leaflet";

interface ZoomTrackerProps {
  onZoomChange: (zoom: number) => void;
}

// Component to track zoom level
export const ZoomTracker = ({ onZoomChange }: ZoomTrackerProps) => {
  const map = useMap();

  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    // Set initial zoom
    onZoomChange(map.getZoom());

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null; // This component doesn't render anything
};
