// Device and DeviceData interfaces
export interface Device {
  device_id: number;
  name: string;
  status: string;
  last_seen: string;
  minutes_since_last_seen: number;
  battery_level: number;
  data_points_collected: number;
}

export interface DeviceData {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  devices: Device[];
}