import { useState, useEffect } from 'react';
import type { SensorData } from '../types/sensor';
import BarangayAnalyticsCard from '../components/Charts/BarangayAnalyticsCard';
import { sampleApiResponse } from '../utils/sampleData';

// Threshold for determining if an area is well-lit (in lux)
const WELL_LIT_THRESHOLD = 300;

function Analytics() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<string | null>(null);
  
  const [useSampleData, setUseSampleData] = useState(true); // Set to true to use sample data by default
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (useSampleData) {
          // Use sample data
          console.log('Using sample data for Balanga City barangays');
          setSensorData(sampleApiResponse.data);
          setLoading(false);
          return;
        }
        
        // Use real API data
        const response = await fetch('https://liwanag-backend.onrender.com/api/v1/check-supabase');
        
        if (!response.ok) {
          throw new Error('Failed to fetch barangay data');
        }
        
        const result = await response.json();
        
        // Store all sensor data - access the data property from the response
        const data = result.data || [];
        setSensorData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useSampleData]);

  // Group sensors by barangay
  const getBarangayGroups = () => {
    const groups: Record<string, SensorData[]> = {};
    
    sensorData.forEach(sensor => {
      // Default to "Uncategorized" if barangay is null
      const barangayName = sensor.barangay || 'Uncategorized';
      
      if (!groups[barangayName]) {
        groups[barangayName] = [];
      }
      
      groups[barangayName].push(sensor);
    });
    
    return groups;
  };

  // Handle errors
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-900/20 p-6 rounded-lg text-white">
          <h2 className="text-2xl mb-2">Error</h2>
          <p>{error}</p>
          <button 
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get barangay groups and names
  const barangayGroups = getBarangayGroups();
  const barangayNames = Object.keys(barangayGroups).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Balanga City Analytics</h1>
        
        <div className="flex items-center gap-4">
          {/* Sample data toggle */}
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">Data Source:</span>
            <button 
              onClick={() => setUseSampleData(!useSampleData)}
              className="px-3 py-1 rounded text-sm bg-gray-700 text-white flex items-center"
            >
              {useSampleData ? 'Using Sample Data' : 'Using API Data'}
              <span className={`ml-2 w-3 h-3 rounded-full ${useSampleData ? 'bg-amber-400' : 'bg-green-400'}`}></span>
            </button>
          </div>
          
          {/* Back button */}
          {selectedBarangay && (
            <button
              onClick={() => setSelectedBarangay(null)}
              className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Overview
            </button>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {!selectedBarangay ? (
            // Overview of all barangays
            <>
              <div className="mb-6">
                <input 
                  type="text" 
                  placeholder="Search barangay..."
                  className="bg-gray-700 text-white p-2 rounded w-full sm:w-64 mb-4"
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {barangayNames.map(name => (
                    <BarangayAnalyticsCard
                      key={name}
                      name={name}
                      data={barangayGroups[name]}
                      onClick={() => setSelectedBarangay(name)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Detailed view for selected barangay
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">{selectedBarangay} Details</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Barangay card */}
                <div className="lg:col-span-1">
                  <BarangayAnalyticsCard
                    name={selectedBarangay}
                    data={barangayGroups[selectedBarangay]}
                  />
                </div>
                
                {/* Detailed metrics */}
                <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">Sensor Data</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sensor</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Street</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lux</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {barangayGroups[selectedBarangay].map(sensor => (
                          <tr key={sensor.id} className="hover:bg-gray-700">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{sensor.sensor_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{sensor.street || 'N/A'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                sensor.lux < WELL_LIT_THRESHOLD
                                  ? 'bg-amber-400/10 text-amber-400'
                                  : 'bg-emerald-400/10 text-emerald-400'
                              }`}>
                                {sensor.lux} lux
                              </span>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                              {new Date(sensor.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Analytics;