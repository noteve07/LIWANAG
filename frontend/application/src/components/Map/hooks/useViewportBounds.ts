import { useState, useCallback } from 'react';
import { LatLngBounds } from 'leaflet';

export interface ViewportBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const useViewportBounds = () => {
  const [bounds, setBounds] = useState<ViewportBounds | null>(null);

  const updateBounds = useCallback((leafletBounds: LatLngBounds) => {
    const newBounds: ViewportBounds = {
      north: leafletBounds.getNorth(),
      south: leafletBounds.getSouth(),
      east: leafletBounds.getEast(),
      west: leafletBounds.getWest(),
    };
    
    setBounds(newBounds);
    console.log('🗺️ Viewport bounds updated:', {
      lat: `${newBounds.south.toFixed(4)} to ${newBounds.north.toFixed(4)}`,
      lng: `${newBounds.west.toFixed(4)} to ${newBounds.east.toFixed(4)}`
    });
  }, []);

  const isPointInViewport = useCallback((lat: number, lon: number): boolean => {
    if (!bounds) return true; // Show all points if bounds not set yet
    
    return (
      lat >= bounds.south &&
      lat <= bounds.north &&
      lon >= bounds.west &&
      lon <= bounds.east
    );
  }, [bounds]);

  return {
    bounds,
    updateBounds,
    isPointInViewport,
  };
};
