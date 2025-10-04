import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";

interface UnsurveyedStreetsProps {
  points: PointData[];
  showPolylines: boolean;
  selectedStreetId?: number;
  onStreetClick: (streetId: number, streetName: string, type: 'unsurveyed') => void;
}

interface StreetFeature {
  type: "Feature";
  geometry: {
    type: "MultiLineString";
    coordinates: number[][][];
  };
  properties: {
    id: number;
    name: string;
    meters: number;
    road_category: string;
    created_at: string;
  };
}

interface StreetsGeoJSON {
  type: "FeatureCollection";
  features: StreetFeature[];
}

export const UnsurveyedStreets = ({ points, showPolylines, selectedStreetId, onStreetClick }: UnsurveyedStreetsProps) => {
  const [streetsData, setStreetsData] = useState<StreetsGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreetsData = async () => {
      try {
        const response = await fetch('/streets.geojson');
        const data = await response.json();
        setStreetsData(data);
      } catch (error) {
        console.error('Failed to load streets data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStreetsData();
  }, []);

  if (!showPolylines || loading || !streetsData) {
    return null;
  }

  // Get all street IDs that have illumination data
  const surveyedStreetIds = new Set(points.map(point => point.street_id));
  
  // Filter streets that don't have any illumination data
  const unsurveyedStreets = streetsData.features.filter(
    street => !surveyedStreetIds.has(street.properties.id)
  );

  // Convert MultiLineString coordinates to Leaflet polyline format
  const renderUnsurveyedStreet = (street: StreetFeature) => {
    const polylines: JSX.Element[] = [];
    const isSelected = selectedStreetId === street.properties.id;
    
    street.geometry.coordinates.forEach((lineString, lineIndex) => {
      // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
      const positions = lineString.map(coord => [coord[1], coord[0]] as [number, number]);
      
      // Add dashed border for selected street
      if (isSelected) {
        polylines.push(
          <Polyline
            key={`unsurveyed-border-${street.properties.id}-${lineIndex}`}
            positions={positions}
            color="#6b7280" // Gray border for unsurveyed streets (no lux data)
            weight={6}      // Thicker for border
            opacity={0.8}   // Semi-transparent
            dashArray="10, 5" // Dashed pattern for border effect
            smoothFactor={1.0}
          />
        );
      }
      
      polylines.push(
        <Polyline
          key={`unsurveyed-${street.properties.id}-${lineIndex}`}
          positions={positions}
          color="#353f52" // 🎨 Keep original dark gray color
          weight={2}       // 📏 Keep original thickness
          opacity={isSelected ? 1.0 : 0.7}    // 👻 More opaque when selected
          smoothFactor={1.0}
          eventHandlers={{
            click: () => onStreetClick(street.properties.id, street.properties.name, 'unsurveyed')
          }}
        />
      );
    });
    
    return polylines;
  };

  return (
    <>
      {unsurveyedStreets.map((street) => (
        <React.Fragment key={`unsurveyed-street-${street.properties.id}`}>
          {renderUnsurveyedStreet(street)}
        </React.Fragment>
      ))}
    </>
  );
};
