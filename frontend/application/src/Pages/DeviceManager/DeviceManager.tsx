import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../../components/ui/card';
import { useSampleDeviceData } from '../../utils/Devicemanagerdata';
import type { Device } from '../../utils/Devicemanagerdata';
import PageTransition from '../../components/ui/PageTransition';

const DeviceManager: React.FC = () => {
  const deviceData = useSampleDeviceData();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Format the timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Format the time since last seen
  const formatTimeSinceLastSeen = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (minutes < 1440) { // Less than a day
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Get the status class for styling based on device status
  const getStatusClass = (status: string) => {
    return status.toLowerCase() === 'online' 
      ? 'bg-green-500' 
      : 'bg-red-500';
  };

  // Get the battery level class for styling
  const getBatteryLevelClass = (level: number) => {
    if (level <= 20) return 'bg-red-500';
    if (level <= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <PageTransition>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-white">Device Manager</h1>
        
        {/* Device Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{deviceData.total_devices}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Online Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{deviceData.online_devices}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Offline Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{deviceData.offline_devices}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Devices Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Device List</CardTitle>
            <CardDescription>
              Manage and monitor your connected devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                  <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Seen</th>
                    <th className="px-6 py-3">Battery</th>
                    <th className="px-6 py-3">Data Points</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deviceData.devices.map((device) => (
                    <tr 
                      key={device.device_id} 
                      className="border-b bg-gray-800 border-gray-700 hover:bg-gray-700 cursor-pointer"
                      onClick={() => setSelectedDevice(device)}
                    >
                      <td className="px-6 py-4">{device.device_id}</td>
                      <td className="px-6 py-4 font-medium">{device.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(device.status)} text-white`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4" title={formatTimestamp(device.last_seen)}>
                        {formatTimeSinceLastSeen(device.minutes_since_last_seen)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-600 rounded-full h-2.5 mr-2">
                            <div 
                              className={`h-2.5 rounded-full ${getBatteryLevelClass(device.battery_level)}`} 
                              style={{ width: `${device.battery_level}%` }}
                            ></div>
                          </div>
                          <span>{device.battery_level}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{device.data_points_collected.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button 
                          className="font-medium text-blue-500 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevice(device);
                          }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Selected Device Details */}
        {selectedDevice && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Device Details: {selectedDevice.name}</CardTitle>
                <button 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setSelectedDevice(null)}
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-gray-400 mb-1">Device ID</h4>
                  <p className="text-white mb-3">{selectedDevice.device_id}</p>
                  
                  <h4 className="text-gray-400 mb-1">Status</h4>
                  <p className="mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(selectedDevice.status)} text-white`}>
                      {selectedDevice.status}
                    </span>
                  </p>
                  
                  <h4 className="text-gray-400 mb-1">Battery Level</h4>
                  <div className="flex items-center mb-3">
                    <div className="w-full bg-gray-600 rounded-full h-2.5 mr-2 max-w-[200px]">
                      <div 
                        className={`h-2.5 rounded-full ${getBatteryLevelClass(selectedDevice.battery_level)}`} 
                        style={{ width: `${selectedDevice.battery_level}%` }}
                      ></div>
                    </div>
                    <span>{selectedDevice.battery_level}%</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-gray-400 mb-1">Last Seen</h4>
                  <p className="text-white mb-3">{formatTimestamp(selectedDevice.last_seen)}</p>
                  
                  <h4 className="text-gray-400 mb-1">Time Since Last Update</h4>
                  <p className="text-white mb-3">{formatTimeSinceLastSeen(selectedDevice.minutes_since_last_seen)}</p>
                  
                  <h4 className="text-gray-400 mb-1">Data Points Collected</h4>
                  <p className="text-white mb-3">{selectedDevice.data_points_collected.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => console.log('Refresh device data')}
                >
                  Refresh Data
                </button>
                {selectedDevice.status.toLowerCase() === 'offline' && (
                  <button 
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                    onClick={() => console.log('Attempt reconnection')}
                  >
                    Attempt Reconnection
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};

export default DeviceManager;
