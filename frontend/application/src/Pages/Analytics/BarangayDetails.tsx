import { useParams, useNavigate } from 'react-router-dom';
import { sampleApiResponse } from '../../utils/sampleData';
import BarangayAnalyticsCard from './BarangayAnalyticsCard';
import { WELL_LIT_THRESHOLD } from '../../constants/metrics';

export default function BarangayDetails() {
  const { barangayName } = useParams();
  const navigate = useNavigate();
  
  // Get sensor data for this barangay
  const sensorData = sampleApiResponse.data.filter(
    sensor => (sensor.barangay || 'Uncategorized') === barangayName
  );
  
  if (sensorData.length === 0) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Barangay Not Found</h2>
        <button 
          onClick={() => navigate('/analytics')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Analytics
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">{barangayName} Details</h2>
        <button
          onClick={() => navigate('/analytics')}
          className="flex items-center text-blue-400 hover:text-blue-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Overview
        </button>
      </div>
      
      {/* Barangay analytics card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <BarangayAnalyticsCard 
            name={barangayName || ''}
            data={sensorData}
            isDetailView={true}
            onClick={() => navigate('/analytics')}
          />
        </div>
        
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Sensor Readings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sensor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Street</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Lux</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sensorData.map(sensor => (
                  <tr key={sensor.id} className="hover:bg-gray-700">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{sensor.sensor_name || 'Unknown'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">{sensor.street || 'Unknown'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-white">
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
  );
}