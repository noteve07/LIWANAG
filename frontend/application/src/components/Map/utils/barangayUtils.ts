// Utility functions for barangay boundary detection and management
import type { PointData } from '../types/mapTypes';
import type { GeoJSONStreet } from '../types/geoJsonTypes';

export interface BarangayData {
  id: number;
  name: string;
  boundary: {
    type: "Polygon" | "MultiPolygon";
    crs: {
      type: "name";
      properties: {
        name: string;
      };
    };
    coordinates: number[][][] | number[][][][]; // [][][]for Polygon, [][][][] for MultiPolygon
  };
}

// Point-in-polygon algorithm using ray casting
export const isPointInPolygon = (
  point: [number, number], // [lon, lat]
  polygon: number[][] // Array of [lon, lat] coordinates
): boolean => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Find which barangay contains the given point
export const findBarangayByPoint = (
  point: [number, number], // [lon, lat]
  barangays: BarangayData[]
): BarangayData | null => {
  for (const barangay of barangays) {
    if (barangay.boundary.type === "MultiPolygon") {
      // For MultiPolygon, check each polygon
      const multiPolygon = barangay.boundary.coordinates as number[][][][];
      
      for (const polygon of multiPolygon) {
        // Extract the outer ring of this polygon
        const outerRing = polygon[0];
        
        if (isPointInPolygon(point, outerRing)) {
          return barangay;
        }
      }
    } else {
      // Regular Polygon
      const polygon = barangay.boundary.coordinates as number[][][];
      // Extract the outer ring of the polygon (first array of coordinates)
      const outerRing = polygon[0];
      
      if (isPointInPolygon(point, outerRing)) {
        return barangay;
      }
    }
  }
  
  return null;
};

// Filter points to only show those within the selected barangay
export const filterPointsByBarangay = (
  points: PointData[], 
  selectedBarangay: BarangayData | null
): PointData[] => {
  if (!selectedBarangay) {
    return points;
  }
  
  return points.filter(point => {
    const pointCoord: [number, number] = [point.lon, point.lat];
    
    if (selectedBarangay.boundary.type === "MultiPolygon") {
      // For MultiPolygon, check each polygon
      const multiPolygon = selectedBarangay.boundary.coordinates as number[][][][];
      
      // Check if the point is in any of the polygons
      return multiPolygon.some(polygon => {
        const outerRing = polygon[0];
        return isPointInPolygon(pointCoord, outerRing);
      });
    } else {
      // Regular Polygon
      const polygon = selectedBarangay.boundary.coordinates as number[][][];
      const outerRing = polygon[0];
      return isPointInPolygon(pointCoord, outerRing);
    }
  });
};

// Filter streets to only show those within the selected barangay
export const filterStreetsByBarangay = (
  streets: GeoJSONStreet[],
  selectedBarangay: BarangayData | null
): GeoJSONStreet[] => {
  if (!selectedBarangay) {
    return streets;
  }
  
  return streets.filter(street => {
    // Function to check if a coordinate point is in the barangay
    const isCoordinateInBarangay = (coord: number[]) => {
      const pointCoord: [number, number] = [coord[0], coord[1]];
      
      if (selectedBarangay.boundary.type === "MultiPolygon") {
        // For MultiPolygon, check each polygon
        const multiPolygon = selectedBarangay.boundary.coordinates as number[][][][];
        
        // Check if the point is in any of the polygons
        return multiPolygon.some(polygon => {
          const outerRing = polygon[0];
          return isPointInPolygon(pointCoord, outerRing);
        });
      } else {
        // Regular Polygon
        const polygon = selectedBarangay.boundary.coordinates as number[][][];
        const outerRing = polygon[0];
        return isPointInPolygon(pointCoord, outerRing);
      }
    };
    
    // Check if any part of the street is within the barangay
    if (street.geometry.type === 'MultiLineString') {
      // For MultiLineString, check each line string
      return (street.geometry.coordinates as number[][][]).some(lineString => 
        lineString.some(coord => isCoordinateInBarangay(coord))
      );
    } else {
      // For LineString
      return (street.geometry.coordinates as number[][]).some(coord => 
        isCoordinateInBarangay(coord)
      );
    }
  });
};
