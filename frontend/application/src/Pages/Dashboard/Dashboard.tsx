import { useState, useEffect } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { sampleDashboardData, getBarangaysWithNoUpdate } from '../../utils/dashboardData';
  // Get barangays with no update for >= 1 day
  const barangaysNoUpdate = getBarangaysWithNoUpdate(sampleApiResponse.data);
import { WELL_LIT_THRESHOLD } from '../../constants/metrics';
import { sampleApiResponse } from '../../utils/sampleData';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import type { ChartConfig } from "../../components/ui/chart";

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

  // Calculate well-lit vs poorly lit for the donut chart
  const wellLitCount = sampleApiResponse.data.filter(s => s.lux >= WELL_LIT_THRESHOLD).length;
  const poorlyLitCount = sampleApiResponse.data.length - wellLitCount;
  
  // Format last updated date
  const lastUpdated = new Date(dashboardData.lastUpdated).toLocaleString();

  // Chart config for lighting improvement over time
  const chartConfig = {
    lighting: {
      label: "Lighting",
      color: "#F59E0B",
    },
    dataPoints: {
      label: "Data Points",
      color: "#3B82F6",
    },
  } satisfies ChartConfig;

  // Format chart data for the lighting improvement chart
  const chartData = dashboardData.lightingImprovementOverTime.map((item) => ({
    date: item.date,
    lighting: item.wellLitPercentage,
    dataPoints: item.dataPoints,
  }));

  // State to toggle between different metrics on the chart
  const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("lighting");

  // Calculate totals for metrics
  const total = {
    lighting: Math.round(
      chartData.reduce((acc, curr) => acc + curr.lighting, 0) / chartData.length
    ),
    dataPoints: chartData.reduce((acc, curr) => acc + curr.dataPoints, 0),
  };

  return (
    <div className="h-full flex flex-col px-8 py-2">
      <h1 className="text-3xl font-bold text-white mb-6">Lighting Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1 content-start">
          {/* Top row metrics */}
          

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Last Updated
              <span className="ml-2">
                {/* Clock Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#a78bfa" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </h3>
            <div className="mt-2">
              <div className="text-lg text-white">{lastUpdated}</div>
              <div className="text-sm text-gray-400 mt-1">Data refreshed automatically</div>
            </div>
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
              <span className="text-4xl font-bold text-white">{dashboardData.totalKilometersSurveyed}</span>
              <span className="ml-1 text-lg text-gray-400">km</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Based on {dashboardData.sensorPointsGathered} data points
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
              <span className="text-4xl font-bold text-white">{dashboardData.sensorPointsGathered}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              From {dashboardData.totalSensors} unique sensors
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
                    Showing lighting metrics for the last 30 days
                  </CardDescription>
                </div>
                <div className="flex">
                  {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map((key) => {
                    return (
                      <button
                        key={key}
                        data-active={activeChart === key}
                        className="data-[active=true]:bg-gray-700 flex flex-1 flex-col justify-center gap-1 border-t border-gray-700 px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                        onClick={() => setActiveChart(key)}
                      >
                        <span className="text-gray-400 text-xs">
                          {chartConfig[key].label}
                        </span>
                        <span className="text-lg leading-none font-bold text-white sm:text-3xl">
                          {key === "lighting" 
                            ? `${total[key]}%` 
                            : total[key].toLocaleString()}
                        </span>
                      </button>
                    )
                  })}
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
                        tickFormatter={(value) => 
                          activeChart === "lighting" ? `${value}%` : value
                        }
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '0.375rem',
                          color: 'white'
                        }}
                        formatter={(value) => [
                          activeChart === "lighting" ? `${value}%` : value, 
                          chartConfig[activeChart].label
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
                        dataKey={activeChart}
                        stroke={chartConfig[activeChart].color || "#F59E0B"}
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2 relative">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center justify-between">
              Well-Lit vs Poorly Lit Areas
              <span className="ml-2">
                {/* Light Bulb Icon */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#fde68a" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 00-6 6c0 2.5 1.5 4.5 3 6v3a3 3 0 006 0v-3c1.5-1.5 3-3.5 3-6a6 6 0 00-6-6z" />
                </svg>
              </span>
            </h3>
            <div className="mt-4 flex justify-center">
              {/* Donut chart would go here, using placeholder for now */}
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#374151" strokeWidth="15" />
                  {/* Calculate the stroke dasharray and dashoffset for the percentage */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="40" 
                    fill="transparent" 
                    stroke="#F59E0B" 
                    strokeWidth="15"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - dashboardData.wellLitPercentage / 100)}
                    transform="rotate(-90 50 50)"
                  />
                  {/* Center text */}
                  <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold" fill="white">
                    {dashboardData.wellLitPercentage}%
                  </text>
                  <text x="50" y="60" textAnchor="middle" dominantBaseline="middle" className="text-xs" fill="#9CA3AF">
                    Well-lit
                  </text>
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                  <span className="text-sm text-gray-300">Well-lit</span>
                </div>
                <span className="text-sm text-white">{wellLitCount} points</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-600 mr-2"></span>
                  <span className="text-sm text-gray-300">Poorly lit</span>
                </div>
                <span className="text-sm text-white">{poorlyLitCount} points</span>
              </div>
            </div>
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
