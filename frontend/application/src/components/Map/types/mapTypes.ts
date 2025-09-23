export interface PointData {
  id: number;
  lat: number;
  lon: number;
  lux: number;
  street_id: number;
  barangay_id: number;
  sensor: string;
  created_at?: string;
}

export interface MapVisualizationProps {
  height?: string;
  width?: string;
}
