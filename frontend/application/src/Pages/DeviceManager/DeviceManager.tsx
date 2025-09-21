
import { useState, useEffect } from 'react';
import { Server, Battery, Clock, WifiOff, Wifi } from 'lucide-react';

interface Device {
  device_id: number;
  name: string;
  status: string;
  last_seen: string;
  minutes_since_last_seen: number;
  battery_level: number;
  data_points_collected: number;
}

interface DeviceData {
  total_devices: number;
  online_devices: number;
  offline_devices: number;
  devices: Device[];
}

function DeviceCard({ device }: { device: Device }) {
  // Format the time since last seen
  const formatTimeSince = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)} hours ago`;
    } else {
      return `${Math.floor(minutes / 1440)} days ago`;
    }
  };

  // Determine the status color
  const statusColor = device.status === 'online' ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{device.name}</h3>
          <p className="text-gray-500">ID: {device.device_id}</p>
        </div>
        <div className="flex items-center">
          <div className={`${statusColor} h-3 w-3 rounded-full mr-2`}></div>
          <span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}>
            {device.status === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm text-gray-700">Last seen: {formatTimeSince(device.minutes_since_last_seen)}</span>
        </div>
        <div className="flex items-center">
          <Battery className="h-4 w-4 text-gray-500 mr-2" />
          <div className="flex items-center">
            <div className="bg-gray-200 w-16 h-3 rounded-full">
              <div 
                className={`h-3 rounded-full ${device.battery_level > 20 ? 'bg-green-500' : 'bg-red-500'}`} 
                style={{ width: `${device.battery_level}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-700 ml-2">{device.battery_level}%</span>
          </div>
        </div>
      </div>
      
      <div className="border-t pt-3">
        <div className="flex items-center">
          <Server className="h-4 w-4 text-gray-500 mr-2" />
          <span className="text-sm text-gray-700">Data points: {device.data_points_collected}</span>
        </div>
      </div>
    </div>
  );
}

function DeviceManager() {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch("https://liwanag-backend.onrender.com/api/v1/devices");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setDeviceData(data);
      } catch (err) {
        setError("Failed to fetch device data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Device Manager</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : deviceData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <Server className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm font-medium">Total Devices</p>
                  <h2 className="text-2xl font-bold">{deviceData.total_devices}</h2>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <Wifi className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm font-medium">Online Devices</p>
                  <h2 className="text-2xl font-bold">{deviceData.online_devices}</h2>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <WifiOff className="h-8 w-8 mr-3" />
                <div>
                  <p className="text-sm font-medium">Offline Devices</p>
                  <h2 className="text-2xl font-bold">{deviceData.offline_devices}</h2>
                </div>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Device List</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deviceData.devices.map((device) => (
              <DeviceCard key={device.device_id} device={device} />
            ))}
          </div>
        </>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No device data available
        </div>
      )}
    </div>
  );
}

export default DeviceManager;
