import React, { useEffect, useState } from "react";
import { Polygon } from "react-leaflet";
import type { BarangayData } from "../utils/barangayUtils";
import fallbackBarangaysData from "../../../assets/fallback/barangays_v2_fallback.json";

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
      // SIMPLER APPROACH: Always start with embedded fallback data
      // This ensures we have data to display immediately
      console.log("🔄 Using embedded fallback barangays data");

      // Convert the fallback data to the expected format
      const fallbackProcessedData = fallbackBarangaysData.features.map(
        (feature: {
          properties: { id: number; name: string };
          geometry: {
            type: string;
            coordinates: number[][][][] | number[][][];
          };
        }) => ({
          id: feature.properties.id || 0,
          name: feature.properties.name || "",
          boundary: {
            type:
              feature.geometry.type === "MultiPolygon"
                ? ("MultiPolygon" as const)
                : ("Polygon" as const),
            crs: {
              type: "name" as const,
              properties: {
                name: "EPSG:4326",
              },
            },
            coordinates: feature.geometry.coordinates,
          },
        })
      );

      setBarangaysData(fallbackProcessedData);
      setLoading(false);

      // Then try to load better quality data asynchronously
      // If it fails, we already have the fallback data loaded
      try {
        console.log("🔄 Attempting to fetch better quality barangay data...");
        const basePath = import.meta.env.BASE_URL ?? "/";
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const baseUrl = origin
          ? new URL(basePath, origin).toString()
          : basePath;
        const barangaysUrl = origin
          ? new URL("barangays_v2.json", baseUrl).toString()
          : `${basePath}barangays_v2.json`;
        const response = await fetch(barangaysUrl);

        if (!response.ok) {
          console.warn(
            `HTTP error fetching barangay data (${barangaysUrl}): ${response.status}`
          );
          return; // Keep using fallback data
        }

        // Check content type and peek at content to detect HTML
        const contentType = response.headers.get("content-type");
        const text = await response.text();

        // Debug what we're getting back
        console.log(`Content type for barangays: ${contentType}`);
        console.log(
          `Response for barangays starts with: "${text.substring(0, 50)}..."`
        );

        // Check if we got HTML instead of JSON
        if (
          text.trim().toLowerCase().startsWith("<!doctype html") ||
          text.trim().toLowerCase().startsWith("<html")
        ) {
          console.warn(
            `Received HTML instead of JSON from ${barangaysUrl}, using fallback data`
          );
          return; // Keep using fallback data
        }

        try {
          // Parse the text we got back as JSON
          const geoJson = JSON.parse(text);

          // Only update if we got valid data
          if (geoJson && geoJson.features && Array.isArray(geoJson.features)) {
            // Convert GeoJSON features to the BarangayData format
            const processedData = geoJson.features.map(
              (feature: {
                properties: { id?: number; name?: string; barangay?: string };
                id?: number;
                geometry: { type: string; coordinates: number[][][][] };
              }) => ({
                id: feature.properties.id || feature.id || 0,
                name:
                  feature.properties.name || feature.properties.barangay || "",
                boundary: {
                  type:
                    feature.geometry.type === "MultiPolygon"
                      ? "MultiPolygon"
                      : "Polygon",
                  crs: {
                    type: "name",
                    properties: {
                      name: "EPSG:4326",
                    },
                  },
                  coordinates: feature.geometry.coordinates,
                },
              })
            );

            setBarangaysData(processedData);
            console.log(
              `✅ Loaded ${processedData.length} barangays from v2 GeoJSON`
            );
          } else {
            console.warn(
              "Invalid barangay data structure, using fallback data"
            );
          }
        } catch (parseError) {
          console.warn("Failed to parse JSON data:", parseError);
          // Keep using fallback data
        }
      } catch (error) {
        console.warn("Error fetching barangay data:", error);
        // Already using fallback data, no need to do anything
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
      if (selectedBarangay.boundary.type === "MultiPolygon") {
        // For MultiPolygon, we need to convert each polygon
        const multiPolygon = selectedBarangay.boundary
          .coordinates as number[][][][];
        return multiPolygon.map((polygon) => convertCoordinates(polygon[0]));
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
