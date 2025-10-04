import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";
import { calculateDistance } from "../utils/mapUtils";

interface PartiallyUnsurveyedStreetsProps {
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

// Distance threshold to consider a street segment as "surveyed"
const SURVEY_RADIUS = 25; // meters - adjust this to make detection more/less sensitive

export const PartiallyUnsurveyedStreets = ({ points, showPolylines }: PartiallyUnsurveyedStreetsProps) => {
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

  // Get streets that have at least some illumination data (partially surveyed)
  const surveyedStreetIds = new Set(points.map(point => point.street_id));
  const partiallySurveyedStreets = streetsData.features.filter(
    street => surveyedStreetIds.has(street.properties.id)
  );

  // Function to check if a coordinate point is near any marker
  const isPointNearMarker = (coord: [number, number], streetId: number): boolean => {
    const streetPoints = points.filter(p => p.street_id === streetId);
    
    for (const marker of streetPoints) {
      const distance = calculateDistance(
        { lat: coord[1], lon: coord[0] }, // Convert [lon, lat] to {lat, lon}
        { lat: marker.lat, lon: marker.lon }
      );
      
      if (distance <= SURVEY_RADIUS) {
        return true;
      }
    }
    return false;
  };

  // Function to create unsurveyed segments for a street
  const renderUnsurveyedSegments = (street: StreetFeature) => {
    const polylines: JSX.Element[] = [];
    
    street.geometry.coordinates.forEach((lineString, lineIndex) => {
      // Process each coordinate pair in the lineString
      for (let i = 0; i < lineString.length - 1; i++) {
        const coord1 = lineString[i];
        const coord2 = lineString[i + 1];
        
        // Check if both points of this segment are far from any markers
        const point1NearMarker = isPointNearMarker([coord1[0], coord1[1]], street.properties.id);
        const point2NearMarker = isPointNearMarker([coord2[0], coord2[1]], street.properties.id);
        
        // If neither point is near a marker, this segment is unsurveyed
        if (!point1NearMarker && !point2NearMarker) {
          polylines.push(
            <Polyline
              key={`partial-unsurveyed-${street.properties.id}-${lineIndex}-${i}`}
              positions={[
                [coord1[1], coord1[0]], // Convert [lon, lat] to [lat, lon]
                [coord2[1], coord2[0]]
              ]}
              color="#353f52" // 🎨 CHANGE COLOR HERE: Light gray for unsurveyed segments
              weight={2}       // 📏 CHANGE LINE THICKNESS HERE: Line width
              opacity={0.7}    // 👻 CHANGE TRANSPARENCY HERE: 0.0 (invisible) to 1.0 (solid)
              smoothFactor={1.0}
              // Solid lines for unsurveyed segments within partially surveyed streets
            />
          );
        }
      }
    });
    
    return polylines;
  };

  return (
    <>
      {partiallySurveyedStreets.map((street) => (
        <React.Fragment key={`partial-unsurveyed-street-${street.properties.id}`}>
          {renderUnsurveyedSegments(street)}
        </React.Fragment>
      ))}
    </>
  );
};
