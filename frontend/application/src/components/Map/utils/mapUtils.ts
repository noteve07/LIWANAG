import L from "leaflet";
import type { PointData } from "../types/mapTypes";

// Road types for lux color calculation
export type RoadType = 'residential' | 'main_road' | 'highway';

// Constants for road types (for easier reference)
export const RoadType = {
  RESIDENTIAL: 'residential' as RoadType,
  MAIN_ROAD: 'main_road' as RoadType,
  HIGHWAY: 'highway' as RoadType
};

// Utility function to get color based on lux value with road-type specific thresholds
export const getLuxColor = (lux: number, roadType: RoadType = RoadType.RESIDENTIAL): string => {
  // Define colors - common across all road types
  const colors = {
    deepRed: "#FF0000",     // Dangerous
    red: "#FF4444",         // Very Poor
    darkOrange: "#FF8800",  // Poor
    orange: "#FFBB33",      // Below Standard
    gold: "#FFD700",        // Fair
    yellow: "#FFEB3B",      // Moderate
    lightGreen: "#76FF03",  // Good
    mediumGreen: "#00E676", // Very Good
    green: "#00C851",       // Excellent
    deepGreen: "#00B248"    // Optimal
  };
  
  // Apply different threshold ranges based on road type
  switch (roadType) {
    case RoadType.MAIN_ROAD:
      // Main roads: Green starts at >30 lux, red is <10 lux
      if (lux < 5) return colors.deepRed;    // <10 - Deep Red
      if (lux < 10) return colors.red;        // 10-15
      if (lux < 18) return colors.darkOrange; // 15-18
      if (lux < 21) return colors.orange;     // 18-21
      if (lux < 23) return colors.gold;       // 21-23
      if (lux < 25) return colors.yellow;     // 23-25
      if (lux < 30) return colors.lightGreen; // 25-27
      if (lux < 35) return colors.mediumGreen; // 27-29
      if (lux < 40) return colors.green;      // 29-30
      return colors.deepGreen;                // >30
      
    case RoadType.HIGHWAY:
      // Highways: Green starts at >50 lux, red is <20 lux
      if (lux < 10) return colors.deepRed;    // <20 - Deep Red
      if (lux < 20) return colors.red;        // 20-25
      if (lux < 30) return colors.darkOrange; // 25-30
      if (lux < 35) return colors.orange;     // 30-35
      if (lux < 38) return colors.gold;       // 35-38
      if (lux < 42) return colors.yellow;     // 38-42
      if (lux < 50) return colors.lightGreen; // 42-45
      if (lux < 60) return colors.mediumGreen; // 45-48
      if (lux < 70) return colors.green;      // 48-50
      return colors.deepGreen;                // >50
      
    case RoadType.RESIDENTIAL:
    default:
      // Residential roads: Light green starts from 20 lux
      if (lux < 3) return colors.deepRed;     // <5 - Deep Red
      if (lux < 5) return colors.red;         // 5-8
      if (lux < 10) return colors.darkOrange; // 8-10
      if (lux < 12) return colors.orange;     // 10-12
      if (lux < 14) return colors.gold;       // 12-14
      if (lux < 16) return colors.yellow;     // 14-16
      if (lux < 20) return colors.lightGreen; // 16-18
      if (lux < 22) return colors.mediumGreen; // 18-20
      if (lux < 24) return colors.green;      // 20-22
      return colors.deepGreen;                // >22
  }
};

// Create marker icon with custom color (zoom-responsive size)
export const createLightIcon = (lux: number, zoom: number, roadType: RoadType = RoadType.RESIDENTIAL) => {
  const color = getLuxColor(lux, roadType);
  
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
