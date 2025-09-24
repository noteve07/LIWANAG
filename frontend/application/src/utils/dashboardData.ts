// Utility to get relative time (e.g., '3 days ago')
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Returns barangays with no update for >= 1 day
export function getBarangaysWithNoUpdate(sensorData: SensorData[]) {
  // Group by barangay and get latest timestamp for each
  const barangayLatest: Record<string, string> = {};
  sensorData.forEach(sensor => {
    if (!sensor.barangay) return;
    const ts = sensor.timestamp;
    if (!barangayLatest[sensor.barangay] || new Date(ts) > new Date(barangayLatest[sensor.barangay])) {
      barangayLatest[sensor.barangay] = ts;
    }
  });
  const now = new Date();
  // Only include barangays where last update is >= 1 day ago
  return Object.entries(barangayLatest)
    .filter(([_, ts]) => {
      const diffMs = now.getTime() - new Date(ts).getTime();
      return diffMs >= 1000 * 60 * 60 * 24;
    })
    .map(([barangay, ts]) => ({
      barangay,
      lastUpdate: new Date(ts),
      lastUpdateString: new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      relative: getRelativeTime(ts),
    }))
    .sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());
}
import type { SensorData } from '../types/sensor';
import { sampleApiResponse } from './sampleData';
import { WELL_LIT_THRESHOLD } from '../constants/metrics';

// Dashboard specific data types
export interface DashboardData {
  wellLitPercentage: number;
  totalKilometersSurveyed: number;
  sensorPointsGathered: number;
  lightingImprovementOverTime: LightingDataPoint[];
  topPriorityStreets: PriorityItem[];
  topPriorityBarangays: PriorityItem[];
  totalSensors: number;
  lastUpdated: string;
}

export interface LightingDataPoint {
  date: string;
  wellLitPercentage: number;
  dataPoints: number;
}

export interface PriorityItem {
  name: string;
  score: number; // Priority score (lower is higher priority - needs more attention)
  averageLux: number;
}

// Function to generate dashboard data from sensor data
export function generateDashboardData(sensorData: SensorData[]): DashboardData {
  // Calculate well-lit percentage
  const wellLitSensors = sensorData.filter(sensor => sensor.lux >= WELL_LIT_THRESHOLD).length;
  const wellLitPercentage = Math.round((wellLitSensors / sensorData.length) * 100);
  
  // Estimate kilometers surveyed (approximate calculation based on sensor distribution)
  // For real implementation, you would calculate actual distances between sensors
  const totalKilometersSurveyed = parseFloat((sensorData.length * 0.05).toFixed(2)); // Assuming sensors are placed ~50m apart
  
  // Count unique sensors
  const uniqueSensors = new Set(sensorData.map(s => s.sensor_name)).size;
  
  // Generate lighting improvement data (simulated historical data)
  const lightingImprovementOverTime = generateHistoricalLightingData();
  
  // Calculate priority streets
  const streetPriorities = calculatePriorityStreets(sensorData);
  
  // Calculate priority barangays
  const barangayPriorities = calculatePriorityBarangays(sensorData);
  
  // Get last updated timestamp
  const timestamps = sensorData.map(s => new Date(s.timestamp).getTime());
  const lastUpdated = new Date(Math.max(...timestamps)).toISOString();
  
  return {
    wellLitPercentage,
    totalKilometersSurveyed,
    sensorPointsGathered: sensorData.length,
    lightingImprovementOverTime,
    topPriorityStreets: streetPriorities.slice(0, 5),
    topPriorityBarangays: barangayPriorities.slice(0, 5),
    totalSensors: uniqueSensors,
    lastUpdated
  };
}

// Generate simulated historical lighting data for the improvement chart
function generateHistoricalLightingData(): LightingDataPoint[] {
  const today = new Date();
  const data: LightingDataPoint[] = [];
  
  // Generate data for the past 30 days
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Start with a baseline of 45% well-lit, increasing gradually with some fluctuations
    // This simulates improvement over time with some day-to-day variations
    const basePercentage = 45 + (30 - i) * 0.5;
    const fluctuation = Math.random() * 10 - 5; // -5 to +5 random fluctuation
    const wellLitPercentage = Math.min(Math.max(Math.round(basePercentage + fluctuation), 0), 100);
    
    // Simulate varying data collection amounts
    const dataPoints = Math.round(100 + Math.random() * 50);
    
    data.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      wellLitPercentage,
      dataPoints
    });
  }
  
  return data;
}

// Calculate priority scores for streets based on lighting conditions
function calculatePriorityStreets(sensorData: SensorData[]): PriorityItem[] {
  // Group sensors by street
  const streetGroups: Record<string, SensorData[]> = {};
  
  sensorData.forEach(sensor => {
    if (sensor.street) {
      if (!streetGroups[sensor.street]) {
        streetGroups[sensor.street] = [];
      }
      streetGroups[sensor.street].push(sensor);
    }
  });
  
  // Calculate priority score for each street
  // Priority score formula: (1 - wellLitPercentage/100) * (1 + 1/averageLux) * 100
  // This gives higher priority (higher score) to poorly lit streets
  const streetPriorities: PriorityItem[] = Object.keys(streetGroups).map(street => {
    const streetSensors = streetGroups[street];
    const wellLitSensors = streetSensors.filter(s => s.lux >= WELL_LIT_THRESHOLD).length;
    const wellLitPercentage = (wellLitSensors / streetSensors.length) * 100;
    const averageLux = streetSensors.reduce((sum, s) => sum + s.lux, 0) / streetSensors.length;
    
    // Calculate priority score - higher score means higher priority (needs more attention)
    const priorityScore = (1 - wellLitPercentage/100) * (1 + 200/averageLux) * 100;
    
    return {
      name: street,
      score: parseFloat(priorityScore.toFixed(2)),
      averageLux: Math.round(averageLux)
    };
  });
  
  // Sort by priority score (descending)
  return streetPriorities.sort((a, b) => b.score - a.score);
}

// Calculate priority scores for barangays based on lighting conditions
function calculatePriorityBarangays(sensorData: SensorData[]): PriorityItem[] {
  // Group sensors by barangay
  const barangayGroups: Record<string, SensorData[]> = {};
  
  sensorData.forEach(sensor => {
    if (sensor.barangay) {
      if (!barangayGroups[sensor.barangay]) {
        barangayGroups[sensor.barangay] = [];
      }
      barangayGroups[sensor.barangay].push(sensor);
    }
  });
  
  // Calculate priority score for each barangay using the same formula as streets
  const barangayPriorities: PriorityItem[] = Object.keys(barangayGroups).map(barangay => {
    const barangaySensors = barangayGroups[barangay];
    const wellLitSensors = barangaySensors.filter(s => s.lux >= WELL_LIT_THRESHOLD).length;
    const wellLitPercentage = (wellLitSensors / barangaySensors.length) * 100;
    const averageLux = barangaySensors.reduce((sum, s) => sum + s.lux, 0) / barangaySensors.length;
    
    // Calculate priority score - higher score means higher priority (needs more attention)
    const priorityScore = (1 - wellLitPercentage/100) * (1 + 200/averageLux) * 100;
    
    return {
      name: barangay,
      score: parseFloat(priorityScore.toFixed(2)),
      averageLux: Math.round(averageLux)
    };
  });
  
  // Sort by priority score (descending)
  return barangayPriorities.sort((a, b) => b.score - a.score);
}

// Pre-calculated dashboard data using the sample API response
export const sampleDashboardData: DashboardData = generateDashboardData(sampleApiResponse.data);