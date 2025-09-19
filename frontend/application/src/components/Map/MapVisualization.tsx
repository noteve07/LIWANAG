import { useEffect, useState } from "react";
import { Marker, Popup, Polyline, Tooltip } from "react-leaflet";
import LeafletMap from "./LeafletMap";
import L from "leaflet";

// Import the sample points JSON
import samplePoints from "./sample_points.json";

interface PointData {
  id: string;
  lat: number;
  lon: number;
  lux: number;
}

interface MapVisualizationProps {
  height?: string;
  width?: string;
}

// Utility function to get color based on lux value
const getLuxColor = (lux: number): string => {
  if (lux < 100) return "#FF0000"; // Dangerous - Deep Red
  if (lux < 200) return "#FF4444"; // Very Poor - Red
  if (lux < 300) return "#FF8800"; // Poor - Dark Orange
  if (lux < 400) return "#FFBB33"; // Below Standard - Orange
  if (lux < 500) return "#FFD700"; // Fair - Gold
  if (lux < 600) return "#FFEB3B"; // Moderate - Yellow
  if (lux < 700) return "#76FF03"; // Good - Light Green
  if (lux < 800) return "#00E676"; // Very Good - Medium Green
  if (lux < 900) return "#00C851"; // Excellent - Green
  return "#00B248"; // Optimal - Deep Green
};

// Create marker icon with custom color
const createLightIcon = (lux: number) => {
  const color = getLuxColor(lux);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
      <path fill="${color}" stroke="white" stroke-width="1" d="M12 2C7.589 2 4 5.589 4 9.995C3.971 13.178 5.482 15.604 7 17c1.5 1.5 1.5 2.5 1.5 3.5v.5h7v-.5c0-1 0-2 1.5-3.5 1.518-1.396 3.029-3.823 3-7.005C20 5.589 16.411 2 12 2z"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "light-marker",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10],
  });
};

function MapVisualization({ height, width }: MapVisualizationProps) {
  const [points, setPoints] = useState<PointData[]>([]);

  // Add CSS for markers
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .light-marker {
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
      }
      .light-marker:hover {
        transform: scale(1.1);
        transition: transform 0.2s;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Load points data
  useEffect(() => {
    setPoints(samplePoints as PointData[]);
  }, []);

  // Function to interpolate between two points
  const interpolatePoints = (
    start: PointData,
    end: PointData,
    steps: number
  ) => {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const lat = start.lat + (end.lat - start.lat) * fraction;
      const lon = start.lon + (end.lon - start.lon) * fraction;
      const lux = start.lux + (end.lux - start.lux) * fraction;
      points.push({ lat, lon, lux });
    }
    return points;
  };

  // Function to create gradient line segments between points
  const renderLineSegments = () => {
    return points.slice(0, -1).map((point, index) => {
      const nextPoint = points[index + 1];
      const segments = interpolatePoints(point, nextPoint, 10); // Create 10 segments for smooth gradient

      return segments.slice(0, -1).map((segStart, segIndex) => {
        const segEnd = segments[segIndex + 1];
        return (
          <Polyline
            key={`line-${index}-${segIndex}`}
            positions={[
              [segStart.lat, segStart.lon],
              [segEnd.lat, segEnd.lon],
            ]}
            pathOptions={{
              color: getLuxColor(segStart.lux),
              weight: 3,
              opacity: 0.7,
            }}
          />
        );
      });
    });
  };

  return (
    <LeafletMap height={height} width={width}>
      {/* Render line segments */}
      {renderLineSegments()}

      {/* Render markers */}
      {points.map((pt) => (
        <Marker
          key={pt.id}
          position={[pt.lat, pt.lon]}
          icon={createLightIcon(pt.lux)}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            permanent={false}
            opacity={1}
          >
            {pt.lux} lx
          </Tooltip>
          <Popup>
            <div>
              <strong>ID:</strong> {pt.id} <br />
              <strong>Lux:</strong> {pt.lux} lx <br />
              <strong>Location:</strong> [{pt.lat.toFixed(6)},{" "}
              {pt.lon.toFixed(6)}]
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMap>
  );
}

export default MapVisualization;
