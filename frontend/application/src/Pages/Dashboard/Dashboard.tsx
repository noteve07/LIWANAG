import { useState, useEffect } from 'react';
import { CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from "recharts";
import { sampleDashboardData, getBarangaysWithNoUpdate } from '../../utils/dashboardData';
import { sampleApiResponse } from '../../utils/sampleData';
import { DonutChart } from '../../components/ui/donut-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";

// Get barangays with no update for >= 1 day
const barangaysNoUpdate = getBarangaysWithNoUpdate(sampleApiResponse.data);


function Dashboard() {
  const [dashboardData, setDashboardData] = useState(sampleDashboardData);
  const [loading, setLoading] = useState(false);
  
  // For a real application, you would fetch this data from an API
  useEffect(() => {
    // Simulate API call with sample data
    setLoading(true);
    
    // Use setTimeout to simulate network delay
    const timer = setTimeout(() => {
      setDashboardData(sampleDashboardData);
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Donut chart data with illumination categories
  const illuminationData = [
    { name: 'Critical', value: 20.2, color: '#EF4444' },  // Red
    { name: 'Low', value: 43.7, color: '#F59E0B' },       // Amber
    { name: 'High', value: 36.1, color: '#10B981' }       // Green
  ];
  
  // Last updated date is now hardcoded in the UI

  // Hardcoded chart data showing progress from 28.4% to 36.1% over 30 days with some fluctuations
  const chartData = [
    { date: "2025-09-08", lighting: 28.4, dataPoints: 3850 },
    { date: "2025-09-11", lighting: 29.1, dataPoints: 3890 },
    { date: "2025-09-14", lighting: 30.3, dataPoints: 3920 },
    { date: "2025-09-17", lighting: 29.8, dataPoints: 3950 }, // Slight decrease
    { date: "2025-09-20", lighting: 31.5, dataPoints: 3980 },
    { date: "2025-09-23", lighting: 32.7, dataPoints: 4010 },
    { date: "2025-09-26", lighting: 31.9, dataPoints: 4060 }, // Another decrease
    { date: "2025-09-29", lighting: 33.8, dataPoints: 4100 },
    { date: "2025-10-02", lighting: 34.5, dataPoints: 4150 },
    { date: "2025-10-05", lighting: 33.9, dataPoints: 4210 }, // Slight decrease
    { date: "2025-10-08", lighting: 36.1, dataPoints: 4281 },
  ];

  // No need to track state variables for chart since we're using fixed values

  return (
    <div className="h-full flex flex-col px-8 py-2">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Lighting Dashboard</h1>
        
        {/* Last Updated - moved to top right */}
        <div className="text-right">
          <div className="flex items-center text-gray-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#a78bfa" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last Updated
          </div>
          <div className="text-white font-medium">October 8, 2025 - 10:23 PM</div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1 content-start">
          {/* Top row metrics - Updated for 3 cards */}
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Well-lit Percentage
              <span className="ml-2">
                {/* Light Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#a78bfa" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </span>
            </h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">36.2</span>
              <span className="ml-1 text-lg text-gray-400">%</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Streets meeting illumination standards
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Total KM Surveyed
              <span className="ml-2">
                {/* Map Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#38bdf8" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.105-1.794l5-2.5a2 2 0 011.79 0l5 2.5A2 2 0 0121 6.618v8.764a2 2 0 01-1.105 1.794L15 20m-6 0V8.382m0 11.618l6-3m0 0V8.382m0 11.618V8.382" />
                </svg>
              </span>
            </h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">65.77</span>
              <span className="ml-1 text-lg text-gray-400">km</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              out of 331.91 km total
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Sensor Points Gathered
              <span className="ml-2">
                {/* Chip Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#f59e0b" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5v-2.25A2.25 2.25 0 0014.25 3h-4.5A2.25 2.25 0 007.5 5.25V7.5m9 9v2.25A2.25 2.25 0 0114.25 21h-4.5A2.25 2.25 0 017.5 18.75V16.5m12-4.5h-1.5m-15 0H3m9-9v1.5m0 15V21m7.5-7.5h-15" />
                </svg>
              </span>
            </h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">4,281</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              From multiple sensor devices
            </p>
          </div>
          
          {/* Middle row - charts */}
          <div className="md:col-span-4">
            <Card className="py-4 sm:py-0 relative">
              <span className="absolute top-4 right-6">
                {/* Chart Line Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#f472b6" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                </svg>
              </span>
              <CardHeader className="flex flex-col items-stretch border-b border-gray-700 !p-0 sm:flex-row">
                <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0">
                  <CardTitle>Lighting Improvement Over Time</CardTitle>
                  <CardDescription>
                    Well-lit area percentage trend
                  </CardDescription>
                </div>
                <div className="flex">
                  {/* Box showing daily change only */}
                  <div className="flex flex-1 flex-col justify-center gap-1 border-t border-gray-700 px-6 py-4 text-center sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
                    <span className="text-gray-400 text-xs">
                      Change from yesterday
                    </span>
                    <span className="text-sm leading-none font-medium text-emerald-300/80 sm:text-lg">
                      +2.2%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2 sm:p-6">
                <div className="bg-gray-900 p-4 rounded h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 20,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorLighting" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tickFormatter={(value) => `${value}%`}
                        domain={[25, 40]}
                        ticks={[25, 30, 35, 40]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '0.375rem',
                          color: 'white'
                        }}
                        formatter={(value) => [
                          `${value}%`, 
                          "Well Lit Percentage"
                        ]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="lighting"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lighting" 
                        stroke="none"
                        fillOpacity={1}
                        fill="url(#colorLighting)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card className="py-0 relative">
              <span className="absolute top-6 right-6 z-10">
                {/* Light Bulb Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fde68a" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 00-6 6c0 2.5 1.5 4.5 3 6v3a3 3 0 006 0v-3c1.5-1.5 3-3.5 3-6a6 6 0 00-6-6z" />
                </svg>
              </span>
              <CardHeader className="flex flex-col items-stretch border-b border-gray-700 pt-6 pb-4 px-6">
                <div className="flex flex-1 flex-col justify-center gap-1">
                  <CardTitle>Street Illumination Status</CardTitle>
                  <CardDescription>
                    Current lighting levels
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="sm:p-6 px-6 py-6">
                <div className="bg-gray-900 rounded p-4 h-[250px] w-full flex flex-col justify-between">
                  <div className="flex justify-center items-center pt-3 mt-2">
                    <div className="h-40 w-40">
                      <DonutChart 
                        data={illuminationData}
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={4}
                        hoverOffset={8}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center space-x-8 pt-3 pb-6 -mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center mb-1">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                        <span className="text-sm text-gray-300">High</span>
                      </div>
                      <span className="text-sm font-medium text-white">36.1%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center mb-1">
                        <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                        <span className="text-sm text-gray-300">Low</span>
                      </div>
                      <span className="text-sm font-medium text-white">43.7%</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center mb-1">
                        <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                        <span className="text-sm text-gray-300">Critical</span>
                      </div>
                      <span className="text-sm font-medium text-white">20.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Bottom row */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Top 5 Priority Streets
              <span className="ml-2">
                {/* Road Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fbbf24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0 0l3-3m-3 3l-3-3" />
                </svg>
              </span>
            </h3>
            <ul className="mt-4 space-y-3">
              {dashboardData.topPriorityStreets.map((street, index) => (
                <li key={street.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-amber-500 mr-2">
                      {index + 1}
                    </span>
                    <span className="text-sm text-white truncate max-w-[150px]" title={street.name}>{street.name}</span>
                  </div>
                  <div className="text-xs text-amber-500 font-medium">
                    {street.averageLux} lux
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Top 5 Priority Barangay
              <span className="ml-2">
                {/* Location Pin Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#34d399" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1116 0c0 4.97-3.582 9-8 9zm0-11a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </span>
            </h3>
            <ul className="mt-4 space-y-3">
              {dashboardData.topPriorityBarangays.map((barangay, index) => (
                <li key={barangay.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-amber-500 mr-2">
                      {index + 1}
                    </span>
                    <span className="text-sm text-white truncate max-w-[150px]" title={barangay.name}>{barangay.name}</span>
                  </div>
                  <div className="text-xs text-amber-500 font-medium">
                    {barangay.averageLux} lux
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {barangaysNoUpdate.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 max-h-58 overflow-y-auto scrollbar relative">
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
                Barangay Last Update
                <span className="ml-2">
                  {/* Exclamation Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#f87171" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </h3>
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-2 border-b border-gray-700 pb-2 mb-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Barangay</span>
                  <span className="text-xs text-gray-400 font-semibold uppercase">Date</span>
                </div>
                <ul className="divide-y divide-gray-700">
                  {barangaysNoUpdate.map(b => (
                    <li key={b.barangay} className="grid grid-cols-2 gap-2 py-2 items-center">
                      <span className="text-white font-medium truncate">{b.barangay}</span>
                      <span className="text-xs text-gray-400">{b.lastUpdateString} ({b.relative})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
