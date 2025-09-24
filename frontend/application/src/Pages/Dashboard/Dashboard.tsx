import { useState, useEffect } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { sampleDashboardData } from '../../utils/dashboardData';
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
    <div className="h-full flex flex-col px-8 py-4">
      <h1 className="text-3xl font-bold text-white mb-6">Lighting Dashboard</h1>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 flex-1 content-start">
          {/* Top row metrics */}
          

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-3">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Total KM Surveyed</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">{dashboardData.totalKilometersSurveyed}</span>
              <span className="ml-1 text-lg text-gray-400">km</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Based on {dashboardData.sensorPointsGathered} data points
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-3">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Sensor Points Gathered</h3>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white">{dashboardData.sensorPointsGathered}</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              From {dashboardData.totalSensors} unique sensors
            </p>
          </div>
          
          {/* Middle row - charts */}
          <div className="md:col-span-4">
            <Card className="py-4 sm:py-0">
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
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Well-Lit vs Poorly Lit Areas</h3>
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
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Top 5 Priority Streets</h3>
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
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Top 5 Priority Barangay</h3>
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
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md md:col-span-2">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Last Updated</h3>
            <div className="mt-2">
              <div className="text-lg text-white">{lastUpdated}</div>
              <div className="text-sm text-gray-400 mt-1">Data refreshed automatically</div>
            </div>
            <div className="mt-4">
              <h4 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Number of Sensors</h4>
              <div className="text-2xl font-bold text-white">{dashboardData.totalSensors}</div>
              <div className="text-sm text-gray-400 mt-1">Active devices</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
