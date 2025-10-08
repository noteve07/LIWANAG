import React, { useEffect, useState } from "react";
import { Polygon } from "react-leaflet";
import type { BarangayData } from "../utils/barangayUtils";

interface BarangayBoundariesProps {
  selectedBarangay: BarangayData | null;
}

export const BarangayBoundaries = ({
  selectedBarangay,
}: BarangayBoundariesProps) => {
  const [barangaysData, setBarangaysData] = useState<BarangayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBarangaysData = async () => {
      try {
        const response = await fetch("/barangays_v2.json");
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
        console.log(`✅ Loaded ${processedData.length} barangays from v2 GeoJSON`);
      } catch (error) {
        console.error("Failed to load barangays v2 data:", error);
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
    return coordinates.map((coord) => [coord[1], coord[0]] as [number, number]);
  };

  // Convert coordinates based on geometry type
  const getPositions = () => {
    if (selectedBarangay) {
      if (selectedBarangay.boundary.type === 'MultiPolygon') {
        // For MultiPolygon, we need to convert each polygon
        const multiPolygon = selectedBarangay.boundary.coordinates as number[][][][];
        return multiPolygon.map(polygon => convertCoordinates(polygon[0]));
      } else {
        // For regular Polygon
        const polygon = selectedBarangay.boundary.coordinates as number[][][];
        return convertCoordinates(polygon[0]);
      }
    }
    return [];
  };

  return (
    <>
      {selectedBarangay && (
        <Polygon
          key={`barangay-boundary-${selectedBarangay.id}`}
          positions={getPositions()}
          color="#075988ff" // Darker blue color for barangay boundary that matches UI theme
          weight={3}
          opacity={0.8}
          fillColor="#3c4e8bff"
          fillOpacity={0.15}
        />
      )}
    </>
  );
};
