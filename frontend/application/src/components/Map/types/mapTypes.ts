export interface PointData {
  id: number;
  lat: number;
  lon: number;
  lux: number;
  street_id: number;
  barangay_id: number;
  sensor: string;
  created_at?: string;
  // New v2 fields
  classification?: string; // 'high', 'low_upper', 'low_lower', 'critical'
  road_type?: string;      // 'highway', 'main_road', 'residential'
}

export interface MapVisualizationProps {
  height?: string;
  width?: string;
}
