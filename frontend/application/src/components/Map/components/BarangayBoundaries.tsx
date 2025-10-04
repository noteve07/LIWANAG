import React, { useEffect, useState } from "react";
import { Polygon } from "react-leaflet";
import type { BarangayData } from "../utils/barangayUtils";

interface BarangayBoundariesProps {
  selectedBarangay: BarangayData | null;
}

export const BarangayBoundaries = ({ selectedBarangay }: BarangayBoundariesProps) => {
  const [barangaysData, setBarangaysData] = useState<BarangayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBarangaysData = async () => {
      try {
        const response = await fetch('/barangays.json');
        const data = await response.json();
        setBarangaysData(data);
      } catch (error) {
        console.error('Failed to load barangays data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBarangaysData();
  }, []);

  if (loading || !selectedBarangay) {
    return null;
  }

  // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
  const convertCoordinates = (coordinates: number[][]) => {
    return coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
  };

  return (
    <>
      {selectedBarangay && (
        <Polygon
          key={`barangay-boundary-${selectedBarangay.id}`}
          positions={convertCoordinates(selectedBarangay.boundary.coordinates[0])}
          color="#3b82f6" // Blue color for barangay boundary
          weight={3}
          opacity={0.8}
          fillColor="#3b82f6"
          fillOpacity={0.1}
        />
      )}
    </>
  );
};
