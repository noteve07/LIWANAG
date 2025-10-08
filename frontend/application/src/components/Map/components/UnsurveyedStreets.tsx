import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";

interface UnsurveyedStreetsProps {
  points: PointData[];
  showPolylines: boolean;
  selectedStreetId?: number;
  onStreetClick: (
    streetId: number,
    streetName: string,
    type: "unsurveyed"
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
}

// This can either be a GeoJSON FeatureCollection or an array of street objects
type StreetsGeoJSON = {
  type: "FeatureCollection";
  features: StreetFeature[];
} | StreetFeature[];

export const UnsurveyedStreets = ({
  points,
  showPolylines,
  selectedStreetId,
  onStreetClick,
}: UnsurveyedStreetsProps) => {
  const [streetsData, setStreetsData] = useState<StreetsGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreetsData = async () => {
      try {
        // Updated file path to match the actual file in public directory
        const response = await fetch("/streets_v2.json");
        const data = await response.json();
        setStreetsData(data);
        console.log("✅ Loaded streets v2 data");
      } catch (error) {
        console.error("Failed to load streets v2 data:", error);
        // Fallback to streets.geojson if streets_v2.json fails
        try {
          console.log("⚠️ Attempting to load fallback streets data");
          const fallbackResponse = await fetch("/streets.geojson");
          const fallbackData = await fallbackResponse.json();
          setStreetsData(fallbackData);
          console.log("✅ Loaded fallback streets data");
        } catch (fallbackError) {
          console.error("Failed to load fallback streets data:", fallbackError);
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
    console.log("⚠️ Missing data for unsurveyed streets: ", {
      hasPoints: !!points,
      isArray: Array.isArray(points),
      pointsLength: points ? (Array.isArray(points) ? points.length : 'not an array') : 'undefined',
      hasStreetsData: !!streetsData
    });
    return null;
  }

  // Get all street IDs that have illumination data
  const surveyedStreetIds = new Set(points.map((point) => point.street_id));

  // Determine if we have a GeoJSON FeatureCollection or an array of street objects
  const isGeoJSONFeatureCollection = 
    typeof streetsData === 'object' && 
    !Array.isArray(streetsData) && 
    streetsData.type === 'FeatureCollection' && 
    Array.isArray(streetsData.features);
  
  // Filter streets that don't have any illumination data
  const unsurveyedStreets = isGeoJSONFeatureCollection
    ? (streetsData as { features: StreetFeature[] }).features.filter(
        (street) => !surveyedStreetIds.has(street.properties?.id ?? street.id)
      )
    : (streetsData as StreetFeature[]).filter(
        (street) => !surveyedStreetIds.has(street.id)
      );

  // Convert MultiLineString coordinates to Leaflet polyline format
  const renderUnsurveyedStreet = (street: StreetFeature) => {
    const polylines: JSX.Element[] = [];
    // Handle both data structures
    const streetId = 'properties' in street ? street.properties?.id : street.id;
    const streetName = 'properties' in street ? street.properties?.name : street.name;
    const isSelected = selectedStreetId === streetId;

    street.geometry.coordinates.forEach((lineString, lineIndex) => {
      // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
      const positions = lineString.map(
        (coord) => [coord[1], coord[0]] as [number, number]
      );

      // Add dashed border for selected street
      if (isSelected) {
        polylines.push(
          <Polyline
            key={`unsurveyed-border-${streetId}-${lineIndex}`}
            positions={positions}
            color="#1e40af" // Primary blue border for unsurveyed streets when selected
            weight={6} // Thicker for border
            opacity={0.8} // Semi-transparent
            dashArray="10, 5" // Dashed pattern for border effect
            smoothFactor={1.0}
          />
        );
      }

      polylines.push(
        <Polyline
          key={`unsurveyed-${streetId}-${lineIndex}`}
          positions={positions}
          color="#353f52" // 🎨 Keep original dark gray color
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
                "unsurveyed"
              );
            },
          }}
        />
      );
    });

    return polylines;
  };

  return (
    <>
      {unsurveyedStreets.map((street) => {
        // Handle both data structures
        const streetId = 'properties' in street ? street.properties?.id : street.id;
        return (
          <React.Fragment key={`unsurveyed-street-${streetId}`}>
            {renderUnsurveyedStreet(street)}
          </React.Fragment>
        );
      })}
    </>
  );
};
