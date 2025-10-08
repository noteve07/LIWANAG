import React, { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";
import type { BarangayData } from "../utils/barangayUtils";
import { findBarangayByPoint } from "../utils/barangayUtils";
import { useMapClickContext } from "../../../contexts/useMapClickContext";

interface BarangayClickHandlerProps {
  onBarangaySelect: (barangay: BarangayData | null) => void;
  selectedBarangay: BarangayData | null;
}

export const BarangayClickHandler = ({ 
  onBarangaySelect, 
  selectedBarangay 
}: BarangayClickHandlerProps) => {
  const [barangaysData, setBarangaysData] = useState<BarangayData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isClickOnStreet } = useMapClickContext();

  useEffect(() => {
    const loadBarangaysData = async () => {
      try {
        const response = await fetch('/barangays_v2.json');
        const geoJson = await response.json();
        
        // Convert GeoJSON features to the BarangayData format
        const processedData = geoJson.features.map((feature: any) => ({
          id: feature.properties.id || feature.id || 0,
          name: feature.properties.name || feature.properties.barangay || '',
          boundary: {
            type: feature.geometry.type === 'MultiPolygon' ? 'MultiPolygon' : 'Polygon',
            crs: {
              type: "name",
              properties: {
                name: "EPSG:4326"
              }
            },
            coordinates: feature.geometry.coordinates
          }
        }));
        
        setBarangaysData(processedData);
        console.log(`🏘️ Loaded ${processedData.length} barangays from GeoJSON`);
      } catch (error) {
        console.error('Failed to load barangays data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBarangaysData();
  }, []);

  useMapEvents({
    click: (e) => {
      if (loading) return;
      
      // Check if this click was on a street polyline
      if (isClickOnStreet.current) {
        // Reset the flag but don't process the click
        isClickOnStreet.current = false;
        return;
      }
      
      const { lat, lng } = e.latlng;
      const clickedPoint: [number, number] = [lng, lat]; // [lon, lat]
      
      console.log(`🖱️ Map clicked at: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
      
      // Find which barangay contains this point
      const foundBarangay = findBarangayByPoint(clickedPoint, barangaysData);
      
      if (foundBarangay) {
        console.log(`🏘️ Found barangay: ${foundBarangay.name} (ID: ${foundBarangay.id})`);
        
        // If clicking on the same barangay, clear selection
        if (selectedBarangay && selectedBarangay.id === foundBarangay.id) {
          console.log(`🔄 Clearing barangay selection`);
          onBarangaySelect(null);
        } else {
          // Select the new barangay
          onBarangaySelect(foundBarangay);
        }
      } else {
        // Clicked outside any barangay, clear selection
        if (selectedBarangay) {
          console.log(`🔄 Clicked outside barangay, clearing selection`);
          onBarangaySelect(null);
        }
      }
    }
  });

  // This component doesn't render anything visible
  return null;
};
