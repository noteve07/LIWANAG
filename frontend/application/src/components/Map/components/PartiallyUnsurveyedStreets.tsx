import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";
import { calculateDistance } from "../utils/mapUtils";

interface PartiallyUnsurveyedStreetsProps {
  points: PointData[];
  showPolylines: boolean;
  selectedStreetId?: number;
  onStreetClick: (
    streetId: number,
    streetName: string,
    type: "partial"
  ) => void;
}

interface StreetFeature {
  id: number;
  name: string;
  meters: number;
  road_category?: string;
  created_at?: string;
  geometry: {
    type: "MultiLineString";
    crs?: {
      type: string;
      properties: {
        name: string;
      };
    };
    coordinates: number[][][];
  };
  properties?: {
    id: number;
    name: string;
    meters: number;
    road_category: string;
    created_at: string;
  };
}

// This can either be a GeoJSON FeatureCollection or an array of street objects
type StreetsGeoJSON = {
  type: "FeatureCollection";
  features: StreetFeature[];
} | StreetFeature[];

// Distance threshold to consider a street segment as "surveyed"
const SURVEY_RADIUS = 25; // meters - adjust this to make detection more/less sensitive

export const PartiallyUnsurveyedStreets = ({
  points,
  showPolylines,
  selectedStreetId,
  onStreetClick,
}: PartiallyUnsurveyedStreetsProps) => {
  const [streetsData, setStreetsData] = useState<StreetsGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreetsData = async () => {
      try {
        // Updated file path to match the actual file in public directory
        const response = await fetch("/streets_v2.json");
        const data = await response.json();
        setStreetsData(data);
        console.log("✅ Loaded streets v2 data for partially unsurveyed streets");
      } catch (error) {
        console.error("Failed to load streets data:", error);
        // Fallback to streets.geojson if streets_v2.json fails
        try {
          console.log("⚠️ Attempting to load fallback streets data for partially unsurveyed streets");
          const fallbackResponse = await fetch("/streets.geojson");
          const fallbackData = await fallbackResponse.json();
          setStreetsData(fallbackData);
          console.log("✅ Loaded fallback streets data for partially unsurveyed streets");
        } catch (fallbackError) {
          console.error("Failed to load fallback streets data for partially unsurveyed streets:", fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStreetsData();
  }, []);

  if (!showPolylines || loading || !streetsData) {
    return null;
  }

  // Make sure both points and streetsData are available
  if (!points || !Array.isArray(points) || points.length === 0 || !streetsData) {
    console.log("⚠️ Missing data for partially surveyed streets: ", {
      hasPoints: !!points,
      isArray: Array.isArray(points),
      pointsLength: points ? (Array.isArray(points) ? points.length : 'not an array') : 'undefined',
      hasStreetsData: !!streetsData
    });
    return null;
  }

  // Determine if we have a GeoJSON FeatureCollection or an array of street objects
  const isGeoJSONFeatureCollection = 
    typeof streetsData === 'object' && 
    !Array.isArray(streetsData) && 
    streetsData.type === 'FeatureCollection' && 
    Array.isArray(streetsData.features);
  
  // Get streets that have at least some illumination data (partially surveyed)
  const surveyedStreetIds = new Set(points.map((point) => point.street_id));
  const partiallySurveyedStreets = isGeoJSONFeatureCollection
    ? (streetsData as { features: StreetFeature[] }).features.filter((street) =>
        surveyedStreetIds.has('properties' in street && street.properties ? street.properties.id : street.id)
      )
    : (streetsData as StreetFeature[]).filter((street) =>
        surveyedStreetIds.has(street.id)
      );

  // Function to check if a coordinate point is near any marker
  const isPointNearMarker = (
    coord: [number, number],
    streetId: number
  ): boolean => {
    if (!points || !Array.isArray(points)) {
      return false;
    }
    
    const streetPoints = points.filter((p) => p.street_id === streetId);

    for (const marker of streetPoints) {
      // Create a point-like object that has the minimum required properties
      const tempPoint = {
        id: 0, // Temporary ID
        lat: coord[1],
        lon: coord[0],
        lux: 0, // Not relevant for distance calculation
        street_id: streetId,
        barangay_id: 0, // Not relevant for distance calculation
        sensor: "" // Not relevant for distance calculation
      };
      
      const distance = calculateDistance(
        tempPoint,
        marker
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
    
    // Handle both data structures
    const streetId = 'properties' in street && street.properties 
      ? street.properties.id 
      : street.id;
    
    const streetName = 'properties' in street && street.properties 
      ? street.properties.name 
      : street.name;
      
    const isSelected = selectedStreetId === streetId;

    // Use primary blue color for highlighting selected streets
    const highlightColor = "#1e40af";

    street.geometry.coordinates.forEach((lineString, lineIndex) => {
      // Process each coordinate pair in the lineString
      for (let i = 0; i < lineString.length - 1; i++) {
        const coord1 = lineString[i];
        const coord2 = lineString[i + 1];

        // Check if both points of this segment are far from any markers
        const point1NearMarker = isPointNearMarker(
          [coord1[0], coord1[1]],
          streetId as number
        );
        const point2NearMarker = isPointNearMarker(
          [coord2[0], coord2[1]],
          streetId as number
        );

        // If neither point is near a marker, this segment is unsurveyed
        if (!point1NearMarker && !point2NearMarker) {
          // Add dashed border for selected street
          if (isSelected) {
            polylines.push(
              <Polyline
                key={`partial-unsurveyed-highlight-${streetId}-${lineIndex}-${i}`}
                positions={[
                  [coord1[1], coord1[0]], // Convert [lon, lat] to [lat, lon]
                  [coord2[1], coord2[0]],
                ]}
                color={highlightColor} // Lux-based highlight color
                weight={6} // Thicker for border
                opacity={0.8} // Semi-transparent
                dashArray="10, 5" // Dashed pattern for border effect
                smoothFactor={1.0}
              />
            );
          }

          polylines.push(
            <Polyline
              key={`partial-unsurveyed-${streetId}-${lineIndex}-${i}`}
              positions={[
                [coord1[1], coord1[0]], // Convert [lon, lat] to [lat, lon]
                [coord2[1], coord2[0]],
              ]}
              color="#353f52" // 🎨 Keep original dark gray color (don't override)
              weight={2} // 📏 Keep original thickness
              opacity={isSelected ? 1.0 : 0.7} // 👻 More opaque when selected
              smoothFactor={1.0}
              eventHandlers={{
                click: (e) => {
                  // Stop event propagation to prevent barangay selection
                  e.originalEvent.stopPropagation();
                  onStreetClick(
                    streetId as number,
                    streetName as string,
                    "partial"
                  );
                },
              }}
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
      {partiallySurveyedStreets.map((street) => {
        // Handle both data structures
        const streetId = 'properties' in street && street.properties 
          ? street.properties.id 
          : street.id;
          
        return (
          <React.Fragment
            key={`partial-unsurveyed-street-${streetId}`}
          >
            {renderUnsurveyedSegments(street)}
          </React.Fragment>
        );
      })}
    </>
  );
};
