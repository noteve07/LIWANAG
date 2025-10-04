import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";

interface UnsurveyedStreetsProps {
  points: PointData[];
  showPolylines: boolean;
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

export const UnsurveyedStreets = ({ points, showPolylines }: UnsurveyedStreetsProps) => {
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
    
    street.geometry.coordinates.forEach((lineString, lineIndex) => {
      // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
      const positions = lineString.map(coord => [coord[1], coord[0]] as [number, number]);
      
      polylines.push(
        <Polyline
          key={`unsurveyed-${street.properties.id}-${lineIndex}`}
          positions={positions}
          color="#6b7280" // Gray color for unsurveyed streets
          weight={2}
          opacity={0.6}
          smoothFactor={1.0}
          dashArray="5, 5" // Dashed line to differentiate from surveyed streets
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
