import L from "leaflet";
import type { PointData } from "../types/mapTypes";

// Utility function to get color based on lux value (0-25 range)
export const getLuxColor = (lux: number): string => {
  if (lux < 2.5) return "#FF0000"; // Dangerous - Deep Red (0-2.5)
  if (lux < 5) return "#FF4444"; // Very Poor - Red (2.5-5)
  if (lux < 7.5) return "#FF8800"; // Poor - Dark Orange (5-7.5)
  if (lux < 10) return "#FFBB33"; // Below Standard - Orange (7.5-10)
  if (lux < 12.5) return "#FFD700"; // Fair - Gold (10-12.5)
  if (lux < 15) return "#FFEB3B"; // Moderate - Yellow (12.5-15)
  if (lux < 17.5) return "#76FF03"; // Good - Light Green (15-17.5)
  if (lux < 20) return "#00E676"; // Very Good - Medium Green (17.5-20)
  if (lux < 22.5) return "#00C851"; // Excellent - Green (20-22.5)
  return "#00B248"; // Optimal - Deep Green (22.5-25)
};

// Utility function to get color based on classification
export const getClassificationColor = (classification?: string): string => {
  if (!classification) return "#00C851"; // Default to green if no classification
  
  switch (classification.toLowerCase()) {
    case 'critical':
      return "#FF0000"; // Deep Red for critical areas
    case 'low_lower':
      return "#FF8800"; // Orange for low_lower areas
    case 'low_upper':
      return "#FFBB33"; // Light orange for low_upper areas
    case 'high':
      return "#00C851"; // Green for high areas
    default:
      return "#00C851"; // Default to green
  }
};

// Create marker icon with custom color (zoom-responsive size)
export const createLightIcon = (lux: number, zoom: number, classification?: string) => {
  // Use classification color if available, otherwise fall back to lux color
  const color = classification ? getClassificationColor(classification) : getLuxColor(lux);
  
  // Calculate size based on zoom level
  // Zoom 17: 40% smaller (60% of original)
  // Zoom 18+: normal size
  const sizeMultiplier = zoom === 17 ? 0.6 : 1.0;
  const size = Math.round(16 * sizeMultiplier);
  const radius = Math.round(6 * sizeMultiplier);
  const innerRadius = Math.round(3 * sizeMultiplier);
  const center = size / 2;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="${color}" opacity="0.7"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "light-marker-fixed",
    iconSize: [size, size],
    iconAnchor: [center, center],
    popupAnchor: [0, -center],
  });
};

// Calculate distance between two points (in meters)
export const calculateDistance = (point1: PointData, point2: PointData): number => {
  const R = 6371000; // Earth's radius in meters
  const lat1Rad = (point1.lat * Math.PI) / 180;
  const lat2Rad = (point2.lat * Math.PI) / 180;
  const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLonRad = ((point2.lon - point1.lon) * Math.PI) / 180;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) *
            Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Interpolation function
export const interpolatePoints = (
  start: PointData,
  end: PointData,
  steps: number
) => {
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const lat = start.lat + (end.lat - start.lat) * fraction;
    const lon = start.lon + (end.lon - start.lon) * fraction;
    const lux = start.lux + (end.lux - start.lux) * fraction;
    points.push({ lat, lon, lux });
  }
  return points;
};
