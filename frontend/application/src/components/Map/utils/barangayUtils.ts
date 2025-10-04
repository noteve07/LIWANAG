// Utility functions for barangay boundary detection and management

export interface BarangayData {
  id: number;
  name: string;
  boundary: {
    type: "Polygon";
    crs: {
      type: "name";
      properties: {
        name: string;
      };
    };
    coordinates: number[][][];
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
    // Extract the outer ring of the polygon (first array of coordinates)
    const outerRing = barangay.boundary.coordinates[0];
    
    if (isPointInPolygon(point, outerRing)) {
      return barangay;
    }
  }
  
  return null;
};

// Filter points to only show those within the selected barangay
export const filterPointsByBarangay = (
  points: any[], // PointData array
  selectedBarangay: BarangayData | null
): any[] => {
  if (!selectedBarangay) {
    return points;
  }
  
  const outerRing = selectedBarangay.boundary.coordinates[0];
  
  return points.filter(point => 
    isPointInPolygon([point.lon, point.lat], outerRing)
  );
};

// Filter streets to only show those within the selected barangay
export const filterStreetsByBarangay = (
  streets: any[], // Street features array
  selectedBarangay: BarangayData | null
): any[] => {
  if (!selectedBarangay) {
    return streets;
  }
  
  const outerRing = selectedBarangay.boundary.coordinates[0];
  
  return streets.filter(street => {
    // Check if any part of the street is within the barangay
    return street.geometry.coordinates.some((lineString: number[][]) => 
      lineString.some((coord: number[]) => 
        isPointInPolygon([coord[0], coord[1]], outerRing)
      )
    );
  });
};
