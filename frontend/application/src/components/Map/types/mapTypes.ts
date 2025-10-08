export interface PointData {
  id: number;
  lat: number;
  lon: number;
  lux: number;
  street_id: number;
  barangay_id: number;
  sensor: string;
  created_at?: string;
  // Merged v2 fields
  classification?: string; // 'high', 'low_upper', 'low_lower', 'critical'
  road_type?: 'residential' | 'main_road' | 'highway'; // Road type with strong typing
}

export interface MapVisualizationProps {
  height?: string;
  width?: string;
}
