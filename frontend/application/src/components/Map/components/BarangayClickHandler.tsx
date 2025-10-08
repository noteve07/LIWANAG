import React, { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";
import type { BarangayData } from "../utils/barangayUtils";
import { findBarangayByPoint } from "../utils/barangayUtils";
import { useMapClickContext } from "../../../contexts/useMapClickContext";
import fallbackBarangaysData from "../../../assets/fallback/barangays_v2_fallback.json";

interface BarangayClickHandlerProps {
  onBarangaySelect: (barangay: BarangayData | null) => void;
  selectedBarangay: BarangayData | null;
}

export const BarangayClickHandler = ({
  onBarangaySelect,
  selectedBarangay,
}: BarangayClickHandlerProps) => {
  const [barangaysData, setBarangaysData] = useState<BarangayData[]>([]);
  const [loading, setLoading] = useState(true);
  const { isClickOnStreet } = useMapClickContext();

  useEffect(() => {
    const loadBarangaysData = async () => {
      // SIMPLER APPROACH: Always start with embedded fallback data
      // This ensures we have data to display immediately
      console.log(
        "🔄 Using embedded fallback barangays data for click handler"
      );

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
        console.log(
          "🔄 Attempting to fetch better quality barangay data for click handler..."
        );
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
        console.log(`Content type for barangays click handler: ${contentType}`);
        console.log(
          `Response for barangays click handler starts with: "${text.substring(
            0,
            50
          )}..."`
        );

        // Check if we got HTML instead of JSON
        if (
          text.trim().toLowerCase().startsWith("<!doctype html") ||
          text.trim().toLowerCase().startsWith("<html")
        ) {
          console.warn(
            `Received HTML instead of JSON from ${barangaysUrl} for click handler, using fallback data`
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
                geometry: {
                  type: string;
                  coordinates: number[][][][] | number[][][];
                };
              }) => ({
                id: feature.properties.id || feature.id || 0,
                name:
                  feature.properties.name || feature.properties.barangay || "",
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

            setBarangaysData(processedData);
            console.log(
              `🏘️ Loaded ${processedData.length} barangays from GeoJSON for click handler`
            );
          } else {
            console.warn(
              "Invalid barangay data structure for click handler, using fallback data"
            );
          }
        } catch (parseError) {
          console.warn(
            "Failed to parse JSON data for click handler:",
            parseError
          );
          // Keep using fallback data
        }
      } catch (error) {
        console.warn("Error fetching barangay data for click handler:", error);
        // Already using fallback data, no need to do anything
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
        console.log(
          `🏘️ Found barangay: ${foundBarangay.name} (ID: ${foundBarangay.id})`
        );

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
    },
  });

  // This component doesn't render anything visible
  return null;
};
