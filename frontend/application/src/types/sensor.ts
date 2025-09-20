export interface SensorData {
  id: number;
  lat: number;
  lon: number;
  lux: number;
  barangay: string | null;
  street: string | null;
  timestamp: string;
  sensor_name: string;
  uploaded_at: string;
}