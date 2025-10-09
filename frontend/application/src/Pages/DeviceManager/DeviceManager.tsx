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
import { Wifi, WifiOff, Play, Square } from 'lucide-react';
import espLogo from './espressif-systems.svg';

const API_BASE_URL = 'https://liwanag-backend.onrender.com/api/v1';

const DeviceManager: React.FC = () => {
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards');
  const [missionFeedback, setMissionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [missionLoadingId, setMissionLoadingId] = useState<number | null>(null);
  const [missionActiveDevices, setMissionActiveDevices] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchDeviceData = async () => {
      setIsLoading(true);
      setError(null);
      setApiError(false);
      
      try {
  const response = await fetch(`${API_BASE_URL}/devices`);
        
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
  const response = await fetch(`${API_BASE_URL}/devices`);
      
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
  const handleStartMission = async (device: Device) => {
    setMissionFeedback(null);
    setMissionLoadingId(device.device_id);

    try {
      const statusResponse = await fetch(`${API_BASE_URL}/device-status/${device.device_id}`);

      if (!statusResponse.ok) {
        const statusText = await statusResponse.text();
        throw new Error(`Status check failed: ${statusResponse.status} ${statusText}`);
      }

      const statusData = await statusResponse.json();

      if (!statusData || typeof statusData.status !== 'string') {
        throw new Error('Malformed status response received from server');
      }

      if (statusData.status.toLowerCase() !== 'online') {
        throw new Error(`Device ${device.device_id} is ${statusData.status}. Bring device online before starting a mission.`);
      }

      const missionResponse = await fetch(`${API_BASE_URL}/set-mission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: device.device_id,
          on_mission: true,
        }),
      });

      if (!missionResponse.ok) {
        const missionText = await missionResponse.text();
        throw new Error(`Mission start failed: ${missionResponse.status} ${missionText}`);
      }

      const missionResult = await missionResponse.json();

      setMissionFeedback({
        type: 'success',
        message: missionResult?.message || `Mission started for device ${device.device_id}.`,
      });

      if (device.device_id === 1001) {
        setMissionActiveDevices(prev => ({
          ...prev,
          [device.device_id]: true,
        }));
      }

      await handleRefresh();
    } catch (missionError) {
      const message = missionError instanceof Error ? missionError.message : 'Mission start failed unexpectedly';
      console.error('Error starting mission:', missionError);
      setMissionFeedback({ type: 'error', message });
    } finally {
      setMissionLoadingId(null);
    }
  };

  const handleStopMission = async (device: Device) => {
    setMissionFeedback(null);
    setMissionLoadingId(device.device_id);

    try {
      const stopResponse = await fetch(`${API_BASE_URL}/stop-mission-device?device_id=${device.device_id}`, {
        method: 'POST',
      });

      if (!stopResponse.ok) {
        const stopText = await stopResponse.text();
        throw new Error(`Mission stop failed: ${stopResponse.status} ${stopText}`);
      }

      const stopResult = await stopResponse.json();

      setMissionFeedback({
        type: 'success',
        message: stopResult?.message || `Mission stopped for device ${device.device_id}.`,
      });

      if (device.device_id === 1001) {
        setMissionActiveDevices(prev => ({
          ...prev,
          [device.device_id]: false,
        }));
      }

      await handleRefresh();
    } catch (missionError) {
      const message = missionError instanceof Error ? missionError.message : 'Mission stop failed unexpectedly';
      console.error('Error stopping mission:', missionError);
      setMissionFeedback({ type: 'error', message });
    } finally {
      setMissionLoadingId(null);
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
    const isAlphaDevice = device.device_id === 1001;
    const isMissionActive = !!missionActiveDevices[device.device_id];
    const isStopMode = isAlphaDevice && isMissionActive;
    const isBusy = missionLoadingId === device.device_id;

    const handleMissionClick = () => {
      if (!canMission || isBusy) return;
      if (isStopMode) {
        handleStopMission(device);
      } else {
        handleStartMission(device);
      }
    };
    
    return (
      <Card className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg overflow-hidden h-auto">
        <CardContent className="py-3 px-2">
          {/* ESP32 Logo - Priority */}
          <div className="flex items-center justify-center p-2">
              <div className="relative">
                <img
                  src={espLogo}
                  alt="ESP32"
                  className="w-20 h-20 object-contain"
                  style={{
                    filter: 'sepia(1) saturate(1000%) hue-rotate(-20deg) brightness(0.95)'
                  }}
                  onError={(e) => {
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                    e.currentTarget.style.display = 'none';
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

            {/* Data Points */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-300">Data Points</span>
              </div>
              <span className="text-xs font-medium text-white">
                {device.data_points_collected.toLocaleString()}
              </span>
            </div>

          </div>

          {/* Action Button */}
          <button
            onClick={handleMissionClick}
            disabled={!canMission || isBusy}
            className={`mx-auto w-3/4 py-2 px-4 mt-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
              canMission
                ? isBusy
                  ? isStopMode
                    ? 'bg-red-800 text-gray-200 cursor-wait opacity-80'
                    : 'bg-amber-700 text-gray-200 cursor-wait opacity-80'
                  : isStopMode
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-lg'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-gray-900 hover:shadow-lg'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {isBusy ? (
              <span className="text-xs uppercase tracking-wide">{isStopMode ? 'Stopping...' : 'Starting...'}</span>
            ) : (
              <>
                {isStopMode ? <Square size={16} /> : <Play size={16} />}
                <span>{isStopMode ? 'Stop Mission' : 'Start Mission'}</span>
              </>
            )}
          </button>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageTransition>
      {apiError ? (
        <Navigate to="/error" state={{ errorMessage: error }} replace />
      ) : (
        <div className="p-6">
          {/* Header with toggle button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-white">Device Manager</h1>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-700 rounded overflow-hidden">
                <button 
                  className={`px-3 py-1 text-sm flex items-center ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                  onClick={() => setViewMode('list')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  List
                </button>
                <button 
                  className={`px-3 py-1 text-sm flex items-center ${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
                  onClick={() => setViewMode('cards')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Cards
                </button>
              </div>
              
              {/* Refresh Button */}
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">⟳</span>
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
          
          {isLoading && !deviceData && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        
        {missionFeedback && (
          <Card className={`mb-4 ${missionFeedback.type === 'success' ? 'bg-emerald-900 border-emerald-700' : 'bg-red-900 border-red-700'}`}>
            <CardContent className="py-4 text-white text-sm">
              {missionFeedback.message}
            </CardContent>
          </Card>
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
            {/* Device Stats Cards */}
            <div className="grid grid-cols-1 items-center md:grid-cols-3 gap-4 mb-4">
              <Card className="flex flex-row items-center justify-center space-x-4 bg-gray-800 border-gray-700 px-2">
                <div className="text-left">
                  <CardTitle className="text-white text-sm">Total Devices</CardTitle>
                </div>
                <div>
                  <p className="text-3xl font-bold text-white">{deviceData.total_devices}</p>
                </div>
              </Card>

              <Card className="flex flex-row items-center justify-center space-x-4 bg-gray-800 border-gray-700 px-2">
                <div className="text-left">
                  <CardTitle className="text-white text-sm">Online Devices</CardTitle>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-500">{deviceData.online_devices}</p>
                </div>
              </Card>

              <Card className="flex flex-row items-center justify-center space-x-4 bg-gray-800 border-gray-700 px-2">
                <div className="text-left">
                  <CardTitle className="text-white text-sm">Offline Devices</CardTitle>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-500">{deviceData.offline_devices}</p>
                </div>
              </Card>
            </div>

            
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
                        {deviceData.devices.map((device: Device) => {
                          const isAlphaDevice = device.device_id === 1001;
                          const isMissionActive = !!missionActiveDevices[device.device_id];
                          const isStopMode = isAlphaDevice && isMissionActive;
                          const isBusy = missionLoadingId === device.device_id;
                          const missionEnabled = canStartMission(device);

                          const buttonClass = missionEnabled
                            ? isBusy
                              ? isStopMode
                                ? 'bg-red-800 text-gray-200 cursor-wait opacity-80'
                                : 'bg-amber-700 text-gray-200 cursor-wait opacity-80'
                              : isStopMode
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed';

                          const handleMission = (e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            if (!missionEnabled || isBusy) return;
                            if (isStopMode) {
                              handleStopMission(device);
                            } else {
                              handleStartMission(device);
                            }
                          };

                          return (
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
                                className={`px-3 py-1 rounded text-xs font-medium ${buttonClass}`}
                                onClick={handleMission}
                                disabled={!missionEnabled || isBusy}
                              >
                                {isBusy
                                  ? (isStopMode ? 'Stopping...' : 'Starting...')
                                  : missionEnabled
                                    ? (isStopMode ? 'Stop Mission' : 'Start Mission')
                                    : 'Disabled'}
                              </button>
                            </td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cards View - 3 cards per row with responsive design */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mx-auto">
                {deviceData.devices.map(device => (
                  <DeviceCard key={device.device_id} device={device} />
                ))}
              </div>
            )}

            {/* Selected Device Details Modal/Card */}
            {selectedDevice && viewMode === 'list' && (() => {
              const missionEnabled = canStartMission(selectedDevice);
              const isAlphaSelected = selectedDevice.device_id === 1001;
              const isMissionActive = !!missionActiveDevices[selectedDevice.device_id];
              const isStopMode = isAlphaSelected && isMissionActive;
              const isBusy = missionLoadingId === selectedDevice.device_id;
              const buttonClass = missionEnabled
                ? isBusy
                  ? isStopMode
                    ? 'bg-red-800 text-gray-200 cursor-wait opacity-80'
                    : 'bg-amber-700 text-gray-200 cursor-wait opacity-80'
                  : isStopMode
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed';

              const handleMission = () => {
                if (!missionEnabled || isBusy) return;
                if (isStopMode) {
                  handleStopMission(selectedDevice);
                } else {
                  handleStartMission(selectedDevice);
                }
              };

              const buttonLabel = isBusy
                ? (isStopMode ? 'Stopping...' : 'Starting...')
                : missionEnabled
                  ? (isStopMode ? 'Stop Mission' : 'Start Mission')
                  : 'Mission Disabled';

              return (
                <Card className="mt-6 bg-gray-800 border-gray-700 py-4 px-2">
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
                        className={`px-4 py-2 rounded font-medium ${buttonClass}`}
                        onClick={handleMission}
                        disabled={!missionEnabled || isBusy}
                      >
                        {buttonLabel}
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
              );
            })()}
          </>
        )}
      </div>
      )}
    </PageTransition>
  );
};

export default DeviceManager;
