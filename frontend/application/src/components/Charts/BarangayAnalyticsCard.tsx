import { useState } from 'react';
import type { SensorData } from '../../types/sensor';
import { LucideAlertCircle, LucideChevronRight, LucideCheck } from 'lucide-react';

// Threshold for determining if an area is well-lit (in lux)
const WELL_LIT_THRESHOLD = 300;

// Utility function for merging class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface BarangayAnalyticsCardProps {
  name: string;
  data: SensorData[];
  onClick?: () => void;
  className?: string;
}

export default function BarangayAnalyticsCard({ name, data, onClick, className }: BarangayAnalyticsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate metrics
  const totalSensors = data.length;
  const wellLitSensors = data.filter(sensor => sensor.lux >= WELL_LIT_THRESHOLD).length;
  const wellLitPercentage = totalSensors > 0 
    ? Math.round((wellLitSensors / totalSensors) * 100) 
    : 0;
  
  // Calculate average lux
  const avgLux = totalSensors > 0
    ? Math.round(data.reduce((sum, sensor) => sum + sensor.lux, 0) / totalSensors)
    : 0;
  
  // Get most recent timestamp
  const latestTimestamp = data.length > 0
    ? new Date(Math.max(...data.map(s => new Date(s.timestamp).getTime())))
    : null;
  
  // Check if this is a critical area (less than 50% well-lit)
  const isCritical = wellLitPercentage < 50;
  
  // Get most common street (if available)
  const streetCounts: Record<string, number> = {};
  data.forEach(sensor => {
    if (sensor.street) {
      streetCounts[sensor.street] = (streetCounts[sensor.street] || 0) + 1;
    }
  });
  
  const mostCommonStreet = Object.entries(streetCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([street]) => street)[0] || 'N/A';

  return (
    <div 
      className={cn(
        "bg-gray-800 rounded-lg shadow-md border border-gray-700 overflow-hidden transition-all duration-200",
        isHovered ? "shadow-lg transform -translate-y-1" : "",
        className || ""
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">{name}</h3>
        {isCritical ? (
          <div className="flex items-center text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full text-xs font-medium">
            <LucideAlertCircle className="h-3 w-3 mr-1" />
            Needs Attention
          </div>
        ) : (
          <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-medium">
            <LucideCheck className="h-3 w-3 mr-1" />
            Good
          </div>
        )}
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {/* Main Metric */}
        <div className="mb-4">
          <div className="text-gray-400 text-xs uppercase mb-1">Well-lit Areas</div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-white">{wellLitPercentage}%</span>
            <span className="text-gray-400 text-sm ml-2">
              ({wellLitSensors}/{totalSensors} points)
            </span>
          </div>
          <div className="mt-2 bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className={wellLitPercentage < 50 ? "bg-amber-500 h-full" : "bg-emerald-500 h-full"}
              style={{ width: `${wellLitPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-gray-400 text-xs uppercase mb-1">Avg Lux</div>
            <div className="flex items-baseline">
              <span className={
                avgLux < WELL_LIT_THRESHOLD 
                  ? "text-lg font-semibold text-amber-400" 
                  : "text-lg font-semibold text-emerald-400"
              }>
                {avgLux}
              </span>
              <span className="text-gray-400 text-xs ml-1">lux</span>
            </div>
          </div>
          
          <div>
            <div className="text-gray-400 text-xs uppercase mb-1">Main Street</div>
            <div className="text-sm text-white truncate" title={mostCommonStreet}>
              {mostCommonStreet}
            </div>
          </div>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-700/30 border-t border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {latestTimestamp ? `Updated ${latestTimestamp.toLocaleDateString()}` : 'No data'}
        </span>
        <div className="text-blue-400 flex items-center text-xs font-medium">
          View Details
          <LucideChevronRight className="h-3 w-3 ml-1" />
        </div>
      </div>
    </div>
  );
}