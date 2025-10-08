import React, { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";
import fallbackStreetsData from "../../../assets/fallback/streets_v2_fallback.json";

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
    type: string; // Changed from "MultiLineString" to string for flexibility
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
    meters?: number;
    road_category?: string;
  };
}

// This can either be a GeoJSON FeatureCollection or an array of street objects
type StreetsGeoJSON =
  | {
      type: "FeatureCollection";
      features: StreetFeature[];
    }
  | StreetFeature[];

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
      // SIMPLER APPROACH: Always start with embedded fallback data
      // This ensures we have data to display immediately
      console.log("🔄 Using embedded fallback streets data for reliability");
      setStreetsData(fallbackStreetsData);
      setLoading(false);

      // Then try to load better quality data asynchronously
      // If it fails, we already have the fallback data loaded
      try {
        console.log("🔄 Attempting to fetch better quality street data...");
        const basePath = import.meta.env.BASE_URL ?? "/";
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const baseUrl = origin
          ? new URL(basePath, origin).toString()
          : basePath;
        const streetsUrl = origin
          ? new URL("streets_v2.json", baseUrl).toString()
          : `${basePath}streets_v2.json`;
        const response = await fetch(streetsUrl, {
          headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });

        if (!response.ok) {
          console.warn(
            `HTTP error fetching streets data (${streetsUrl}): ${response.status}`
          );
          return; // Keep using fallback data
        }

        // Check content type and peek at content to detect HTML
        const contentType = response.headers.get("content-type");
        const text = await response.text();

        // Debug what we're getting back
        console.log(`Content type: ${contentType}`);
        console.log(`Response starts with: "${text.substring(0, 50)}..."`);

        // Check if we got HTML instead of JSON
        if (
          text.trim().toLowerCase().startsWith("<!doctype html") ||
          text.trim().toLowerCase().startsWith("<html")
        ) {
          console.warn(
            `Received HTML instead of JSON from ${streetsUrl}, using fallback data`
          );
          return; // Keep using fallback data
        }

        try {
          // Parse the text we got back as JSON
          const data = JSON.parse(text);

          // Only update if we got valid data
          if (data && (Array.isArray(data) || data.features)) {
            setStreetsData(data);
            console.log("✅ Loaded better quality street data");
          } else {
            console.warn("Invalid street data structure, using fallback data");
          }
        } catch (parseError) {
          console.warn("Failed to parse JSON data:", parseError);
          // Keep using fallback data
        }
      } catch (error) {
        console.warn("Error fetching streets data:", error);
        // Already using fallback data, no need to do anything
      }
    };

    loadStreetsData();
  }, []);

  if (!showPolylines || loading || !streetsData) {
    return null;
  }

  // Make sure both points and streetsData are available
  if (
    !points ||
    !Array.isArray(points) ||
    points.length === 0 ||
    !streetsData
  ) {
    console.log("⚠️ Missing data for unsurveyed streets: ", {
      hasPoints: !!points,
      isArray: Array.isArray(points),
      pointsLength: points
        ? Array.isArray(points)
          ? points.length
          : "not an array"
        : "undefined",
      hasStreetsData: !!streetsData,
    });
    return null;
  }

  // Get all street IDs that have illumination data
  const surveyedStreetIds = new Set(points.map((point) => point.street_id));

  // Determine if we have a GeoJSON FeatureCollection or an array of street objects
  const isGeoJSONFeatureCollection =
    typeof streetsData === "object" &&
    !Array.isArray(streetsData) &&
    streetsData.type === "FeatureCollection" &&
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
    const streetId = "properties" in street ? street.properties?.id : street.id;
    const streetName =
      "properties" in street ? street.properties?.name : street.name;
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
        const streetId =
          "properties" in street ? street.properties?.id : street.id;
        return (
          <React.Fragment key={`unsurveyed-street-${streetId}`}>
            {renderUnsurveyedStreet(street)}
          </React.Fragment>
        );
      })}
    </>
  );
};
