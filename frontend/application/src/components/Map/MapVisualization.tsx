import React, { useEffect, useState } from "react";
import { Marker, Popup, Polyline, Tooltip, useMap } from "react-leaflet";
import LeafletMap from "./LeafletMap";
import L from "leaflet";

interface PointData {
  id: number;
  lat: number;
  lon: number;
  lux: number;
  street_id: number;
  barangay_id: number;
  sensor: string;
  created_at?: string;
}

interface MapVisualizationProps {
  height?: string;
  width?: string;
}

// Utility function to get color based on lux value (0-25 range)
const getLuxColor = (lux: number): string => {
  if (lux < 2.5) return "#FF0000"; // Dangerous - Deep Red (0-2.5)
  if (lux < 5) return "#FF4444"; // Very Poor - Red (2.5-5)
  if (lux < 7.5) return "#FF8800"; // Poor - Dark Orange (5-7.5)
  if (lux < 10) return "#FFBB33"; // Below Standard - Orange (7.5-10)
  if (lux < 12.5) return "#FFD700"; // Fair - Gold (10-12.5)
  if (lux < 15) return "#FFEB3B"; // Moderate - Yellow (12.5-15)
  if (lux < 17.5) return "#76FF03"; // Good - Light Green (15-17.5)
  if (lux < 20) return "#00E676"; // Very Good - Medium Green (17.5-20)
  if (lux < 22.5) return "#00C851"; // Excellent - Green (20-22.5)
  return "#00B248"; // Optimal - Deep Green (22.5-25)
};

// Create marker icon with custom color (zoom-responsive size)
const createLightIcon = (lux: number, zoom: number) => {
  const color = getLuxColor(lux);
  
  // Calculate size based on zoom level
  // Zoom 17: 40% smaller (60% of original)
  // Zoom 18+: normal size
  const sizeMultiplier = zoom === 17 ? 0.6 : 1.0;
  const size = Math.round(16 * sizeMultiplier);
  const radius = Math.round(6 * sizeMultiplier);
  const innerRadius = Math.round(3 * sizeMultiplier);
  const center = size / 2;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="${color}" opacity="0.7"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "light-marker-fixed",
    iconSize: [size, size],
    iconAnchor: [center, center],
    popupAnchor: [0, -center],
  });
};

// Control panel component
const ControlPanel = ({
  showMarkers,
  showPolylines,
  onToggleMarkers,
  onTogglePolylines,
}: {
  showMarkers: boolean;
  showPolylines: boolean;
  onToggleMarkers: () => void;
  onTogglePolylines: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Control Panel Button */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "rgba(30, 30, 30, 0.9)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(1.1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(1)")
        }
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 15.5A3.5 3.5 0 0 0 15.5 12 3.5 3.5 0 0 0 12 8.5a3.5 3.5 0 0 0-3.5 3.5 3.5 3.5 0 0 0 3.5 3.5zm0-5A1.5 1.5 0 0 1 13.5 12 1.5 1.5 0 0 1 12 13.5 1.5 1.5 0 0 1 10.5 12 1.5 1.5 0 0 1 12 10.5zm7.43 2.4l-.84-.83a6.4 6.4 0 0 0-.22-2.6l.89-.89a7.1 7.1 0 0 0-.63-1.05l-1.19.51a6.5 6.5 0 0 0-2.23-1.29l-.51-1.19a7.1 7.1 0 0 0-1.05-.63l-.89.89a6.4 6.4 0 0 0-2.6-.22l-.83-.84a7.1 7.1 0 0 0-1.05.63l.51 1.19a6.5 6.5 0 0 0-1.29 2.23l-1.19.51a7.1 7.1 0 0 0-.63 1.05l.89.89a6.4 6.4 0 0 0-.22 2.6l-.84.83a7.1 7.1 0 0 0 .63 1.05l1.19-.51a6.5 6.5 0 0 0 2.23 1.29l.51 1.19a7.1 7.1 0 0 0 1.05.63l.89-.89a6.4 6.4 0 0 0 2.6.22l.83.84a7.1 7.1 0 0 0 1.05-.63l-.51-1.19a6.5 6.5 0 0 0 1.29-2.23l1.19-.51a7.1 7.1 0 0 0 .63-1.05l-.89-.89a6.4 6.4 0 0 0 .22-2.6z"
            fill="white"
          />
        </svg>
      </div>

      {/* Slide-up Panel */}
      <div
        style={{
          position: "absolute",
          bottom: isExpanded ? "70px" : "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          backgroundColor: "rgba(30, 30, 30, 0.9)",
          padding: "15px 20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          transition: "bottom 0.3s ease",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "200px",
        }}
      >
         <label
           style={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             color: "white",
             cursor: "pointer",
             userSelect: "none",
           }}
         >
           Markers (Zoom ≥ 17)
          <div
            style={{
              width: "40px",
              height: "20px",
              backgroundColor: showMarkers ? "#1976d2" : "#666",
              borderRadius: "10px",
              position: "relative",
              transition: "background-color 0.2s",
              cursor: "pointer",
            }}
            onClick={onToggleMarkers}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: showMarkers ? "22px" : "2px",
                transition: "left 0.2s",
              }}
            />
          </div>
        </label>

         <label
           style={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             color: "white",
             cursor: "pointer",
             userSelect: "none",
           }}
         >
           Street Lines (Zoom ≤ 16)
          <div
            style={{
              width: "40px",
              height: "20px",
              backgroundColor: showPolylines ? "#1976d2" : "#666",
              borderRadius: "10px",
              position: "relative",
              transition: "background-color 0.2s",
              cursor: "pointer",
            }}
            onClick={onTogglePolylines}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: showPolylines ? "22px" : "2px",
                transition: "left 0.2s",
              }}
            />
          </div>
        </label>
      </div>
    </>
  );
};

// Component to track zoom level
const ZoomTracker = ({ onZoomChange }: { onZoomChange: (zoom: number) => void }) => {
  const map = useMap();

  useEffect(() => {
    const handleZoomEnd = () => {
      onZoomChange(map.getZoom());
    };

    // Set initial zoom
    onZoomChange(map.getZoom());

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map, onZoomChange]);

  return null; // This component doesn't render anything
};

function MapVisualization({ height, width }: MapVisualizationProps) {
  const [points, setPoints] = useState<PointData[]>([]);
  const [streetNames, setStreetNames] = useState<string[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPolylines, setShowPolylines] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(13); // Default zoom level

  // CSS for markers
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .light-marker-fixed {
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        transform-origin: center center;
      }
      .light-marker-fixed svg {
        width: 16px !important;
        height: 16px !important;
        transform: none !important;
      }
      .light-marker-fixed:hover {
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        transition: filter 0.2s;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle zoom change for visibility logic
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    console.log(`Zoom level: ${newZoom}`);
  };

  // Load points data from API
  useEffect(() => {
    const fetchIlluminationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch from the new illumination-data-demo endpoint
        const response = await fetch('http://127.0.0.1:8000/api/v1/illumination-data-demo');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.data && Array.isArray(result.data)) {
          setPoints(result.data);
          
          // Extract unique street IDs (since we're using street_id instead of street_name)
          const uniqueStreetIds = [
            ...new Set(result.data.map((p: PointData) => `Street ${p.street_id}`)),
          ] as string[];
          setStreetNames(uniqueStreetIds);
          
          console.log(`Loaded ${result.data.length} illumination points from demo dataset`);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching illumination data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load illumination data');
      } finally {
        setLoading(false);
      }
    };

    fetchIlluminationData();
  }, []);

  // Interpolation function
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

  // Calculate distance between two points (in meters)
  const calculateDistance = (point1: PointData, point2: PointData): number => {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = (point1.lat * Math.PI) / 180;
    const lat2Rad = (point2.lat * Math.PI) / 180;
    const deltaLatRad = ((point2.lat - point1.lat) * Math.PI) / 180;
    const deltaLonRad = ((point2.lon - point1.lon) * Math.PI) / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Function to create gradient line segments for a street (only connect nearby points)
  const renderStreetLines = (streetName: string) => {
    // Extract street ID from the streetName (format: "Street X")
    const streetId = parseInt(streetName.replace('Street ', ''));
    const streetPoints = points.filter((p) => p.street_id === streetId);
    
    // Sort points by proximity to create a logical path
    if (streetPoints.length < 2) return [];
    
    const MAX_CONNECTION_DISTANCE = 100; // Maximum distance in meters to connect points
    const connectedSegments: JSX.Element[] = [];
    
    // For each point, find its nearest neighbor within the connection distance
    streetPoints.forEach((point, index) => {
      streetPoints.forEach((otherPoint, otherIndex) => {
        if (index >= otherIndex) return; // Avoid duplicate lines
        
        const distance = calculateDistance(point, otherPoint);
        
        // Only connect points that are close to each other
        if (distance <= MAX_CONNECTION_DISTANCE) {
          const segments = interpolatePoints(point, otherPoint, 10);
          
          segments.slice(0, -1).forEach((segStart, segIndex) => {
            const segEnd = segments[segIndex + 1];
            connectedSegments.push(
              <Polyline
                key={`${streetName}-${point.id}-${otherPoint.id}-${segIndex}`}
                positions={[
                  [segStart.lat, segStart.lon],
                  [segEnd.lat, segEnd.lon],
                ]}
                color={getLuxColor((segStart.lux + segEnd.lux) / 2)}
                weight={3}
                opacity={0.8}
              />
            );
          });
        }
      });
    });
    
    return connectedSegments;
  };

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          position: "relative",
          height: height || "500px",
          width: width || "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
          color: "#666",
          fontSize: "16px",
        }}
      >
        Loading illumination data...
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        style={{
          position: "relative",
          height: height || "500px",
          width: width || "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fee",
          color: "#c33",
          fontSize: "16px",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <div>
          <div>Failed to load illumination data</div>
          <div style={{ fontSize: "14px", marginTop: "8px" }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        height: height || "500px",
        width: width || "100%",
        overflow: "hidden",
        zIndex: 1,
        marginLeft: "0",
        paddingLeft: "16px", // Small padding from the left edge of content area
      }}
    >
      <ControlPanel
        showMarkers={showMarkers}
        showPolylines={showPolylines}
        onToggleMarkers={() => setShowMarkers((prev) => !prev)}
        onTogglePolylines={() => setShowPolylines((prev) => !prev)}
      />
      <div style={{ 
        height: "100%", 
        width: "100%", 
        position: "relative",
        overflow: "hidden",
        zIndex: 1,
        marginLeft: "0",
      }}>
         <LeafletMap height="100%" width="100%">
           <ZoomTracker onZoomChange={handleZoomChange} />
           
           {/* Show polylines when zoom <= 16 (zoomed out - overview) */}
           {showPolylines && zoom <= 16 &&
             streetNames.map((streetName) => (
               <React.Fragment key={streetName}>
                 {renderStreetLines(streetName)}
               </React.Fragment>
             ))}

          {/* Show markers when zoom >= 17 (zoomed in - detailed view) */}
          {showMarkers && zoom >= 17 &&
            points.map((pt) => (
              <Marker
                key={pt.id}
                position={[pt.lat, pt.lon]}
                icon={createLightIcon(pt.lux, zoom)}
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
                    <strong>Sensor:</strong> {pt.sensor} <br />
                    <strong>Street ID:</strong> {pt.street_id} <br />
                    <strong>Barangay ID:</strong> {pt.barangay_id} <br />
                    <strong>Lux:</strong> {pt.lux} lx <br />
                    <strong>Location:</strong> [{pt.lat.toFixed(6)},{" "}
                    {pt.lon.toFixed(6)}]
                    {pt.created_at && (
                      <>
                        <br />
                        <strong>Created:</strong> {new Date(pt.created_at).toLocaleString()}
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </LeafletMap>
      </div>
    </div>
  );
}

export default MapVisualization;
