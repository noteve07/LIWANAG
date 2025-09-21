import { useMemo } from 'react';

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

export const useSampleDeviceData = () => {
  // Hardcoded sample data for testing/fallback
  const sampleData = useMemo<DeviceData>(() => ({
    total_devices: 4,
    online_devices: 1,
    offline_devices: 3,
    devices: [
      {
        device_id: 1001,
        name: "Alpha",
        status: "offline",
        last_seen: "2025-09-20T09:11:53.162631",
        minutes_since_last_seen: 1334,
        battery_level: 20,
        data_points_collected: 1250
      },
      {
        device_id: 1002,
        name: "Bravo",
        status: "online",
        last_seen: "2025-09-21T09:04:13.733111",
        minutes_since_last_seen: 5,
        battery_level: 85,
        data_points_collected: 3420
      },
      {
        device_id: 1003,
        name: "Charlie",
        status: "offline",
        last_seen: "2025-09-18T10:45:00.195668",
        minutes_since_last_seen: 4121,
        battery_level: 60,
        data_points_collected: 2180
      },
      {
        device_id: 2001,
        name: "Test Offline Device",
        status: "offline",
        last_seen: "2025-09-14T10:59:34.052982",
        minutes_since_last_seen: 9866,
        battery_level: 10,
        data_points_collected: 540
      }
    ]
  }), []);

  return sampleData;
};
