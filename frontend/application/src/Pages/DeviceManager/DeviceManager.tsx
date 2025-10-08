import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '../../components/ui/card';
import PageTransition from '../../components/ui/PageTransition';
import type { Device, DeviceData } from '../../types/device';
import { Navigate } from 'react-router-dom';
import { Activity, Wifi, WifiOff, Play } from 'lucide-react';
import esp32Image from '../../assets/logo/esp32_logo.png';

const DeviceManager: React.FC = () => {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');

  useEffect(() => {
    const fetchDeviceData = async () => {
      setIsLoading(true);
      setError(null);
      setApiError(false);
      
      try {
        const response = await fetch('https://liwanag-backend.onrender.com/api/v1/devices');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setDeviceData(data);
      } catch (err) {
        console.error('Error fetching device data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setApiError(true);
        setDeviceData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDeviceData();
  }, []);
  
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
  
  // Handle refresh action
  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    setApiError(false);
    
    try {
      const response = await fetch('https://liwanag-backend.onrender.com/api/v1/devices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setDeviceData(data);
    } catch (err) {
      console.error('Error refreshing device data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setApiError(true);
      setDeviceData(null);
    } finally {
      setIsLoading(false);
    }
  };


  // Handle Start Mission button
  const handleStartMission = (device: Device) => {
    console.log(`Starting mission for device: ${device.name}`);
    // Add mission logic here
    
    // Update device mission status - in a real app this would be done via API
    const updatedDevices = deviceData?.devices.map(d => 
      d.device_id === device.device_id 
        ? {...d, missionStatus: 'ACTIVE'} 
        : d
    );
    
    if (deviceData && updatedDevices) {
      setDeviceData({...deviceData, devices: updatedDevices});
    }
  };

  // Check if device can start mission (only Alpha devices for now)
  const canStartMission = (device: Device) => {
    return device.name.toLowerCase().includes('alpha');
  };

  // Device Card Component
  const DeviceCard = ({ device }: { device: Device }) => {
    const isOnline = device.status.toLowerCase() === 'online';
    const canMission = canStartMission(device);
    
    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg overflow-hidden">
        <CardContent className="p-4">
          {/* ESP32 Logo - Priority */}
          <div className="flex items-center justify-center p-2">
            <div className="relative">
              <img 
                src={esp32Image} 
                alt="ESP32" 
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  // If the direct path fails, show fallback icon
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              {/* Fallback ESP32 Icon */}
              <div className="hidden w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">ESP32</span>
              </div>
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} border-2 border-gray-800`}></div>
            </div>
          </div>

          {/* Device Name and Status */}
          <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-white mb-2">{device.name}</h3>
          </div>
          
          <div className="grid gap-4 grid-cols-2">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                {isOnline ? (
                  <Wifi size={16} className="text-green-400" />
                ) : (
                  <WifiOff size={16} className="text-red-400" />
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(device.status)} text-white`}>
                  {device.status}
                </span>
              </div>
            </div> 
            
            {/* Mission Status */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Activity size={16} className={device.missionStatus === 'ACTIVE' ? "text-amber-400" : "text-blue-400"} />
                <span className={`text-xs font-medium ${device.missionStatus === 'ACTIVE' ? "text-amber-400" : "text-white"}`}>
                  {device.missionStatus || 'IDLE'}
                </span>
              </div>
            </div>

            {/* Last Seen */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <Activity size={14} className="text-blue-400" />
                <span className="text-xs text-gray-300">Last Seen</span>
              </div>
              <span className="text-xs font-medium text-white">
                {formatTimeSinceLastSeen(device.minutes_since_last_seen)}
              </span>
            </div>

            {/* Data Points */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-300">Data Points</span>
              </div>
              <span className="text-xs font-medium text-white">
                {device.data_points_collected.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Action Button */}
          <button
            onClick={() => canMission ? handleStartMission(device) : undefined}
            disabled={!canMission}
            className={`w-full py-3 px-4 mt-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              canMission
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 hover:shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            <Play size={16} />
            <span>Start Mission</span>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <PageTransition>
      {apiError ? (
        <Navigate to="/error" state={{ errorMessage: error }} replace />
      ) : (
        <div className="">
          {/* Header with toggle button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-white">Device Manager</h1>
            </div>
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-full overflow-hidden p-1">
                <button 
                  className={`px-3 py-1.5 text-xs font-medium flex items-center rounded-full transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
                  onClick={() => setViewMode('cards')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </button>
                <button 
                  className={`px-3 py-1.5 text-xs font-medium flex items-center rounded-full transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white'}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </button>
              </div>
              
              {/* Refresh Button */}
              <button 
                className="p-2.5 bg-gray-800 border border-gray-700 text-blue-400 hover:text-blue-300 rounded-full flex items-center justify-center transition-all hover:border-blue-500 hover:shadow-glow"
                onClick={handleRefresh}
                disabled={isLoading}
                style={{ boxShadow: isLoading ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none' }}
              >
                {isLoading ? (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {isLoading && !deviceData && (
            <div className="flex flex-col justify-center items-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-600 border-t-blue-500"></div>
              <p className="mt-4 text-gray-400 text-sm">Loading devices...</p>
            </div>
          )}
        
        {error && !apiError && !deviceData && (
          <Card className="mb-6 bg-red-900 border-red-700">
            <CardHeader>
              <CardTitle>Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleRefresh}
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        )}
        
        {deviceData && (
          <>
            {/* List View */}
            {viewMode === 'list' && (
              <Card className="mb-6 bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Device List</CardTitle>
                  <CardDescription className="text-gray-400">
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
                        {deviceData.devices.map((device: Device) => (
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
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  canStartMission(device)
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canStartMission(device)) {
                                    handleStartMission(device);
                                  }
                                }}
                                disabled={!canStartMission(device)}
                              >
                                {canStartMission(device) ? 'Start Mission' : 'Disabled'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cards View - 3 cards per row (6 total: 3 top, 3 bottom) */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mx-auto">
                {deviceData.devices.map(device => (
                  <DeviceCard key={device.device_id} device={device} />
                ))}
              </div>
            )}

            {/* Selected Device Details Modal/Card */}
            {selectedDevice && viewMode === 'list' && (
              <Card className="mt-6 bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Device Details: {selectedDevice.name}</CardTitle>
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
                      className={`px-4 py-2 rounded font-medium ${
                        canStartMission(selectedDevice)
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                      onClick={() => canStartMission(selectedDevice) ? handleStartMission(selectedDevice) : undefined}
                      disabled={!canStartMission(selectedDevice)}
                    >
                      {canStartMission(selectedDevice) ? 'Start Mission' : 'Mission Disabled'}
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
          </>
        )}
      </div>
      )}
    </PageTransition>
  );
};

export default DeviceManager;
