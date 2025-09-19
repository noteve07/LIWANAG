import React, { useEffect, useState } from "react";
import { Marker, Popup, Polyline, Tooltip } from "react-leaflet";
import LeafletMap from "./LeafletMap";
import L from "leaflet";

// Import the sample points JSON
import samplePoints from "./from_backend.json";

interface PointData {
  id: string;
  lat: number;
  lon: number;
  lux: number;
  street_name: string;
  barangay_name: string;
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
          Markers
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
          Street Lines
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

function MapVisualization({ height, width }: MapVisualizationProps) {
  const [points, setPoints] = useState<PointData[]>([]);
  const [streetNames, setStreetNames] = useState<string[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPolylines, setShowPolylines] = useState(true);

  // CSS for markers
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
    const uniqueStreets = [
      ...new Set((samplePoints as PointData[]).map((p) => p.street_name)),
    ];
    setStreetNames(uniqueStreets);
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

  // Function to create gradient line segments for a street
  const renderStreetLines = (streetName: string) => {
    const streetPoints = points.filter((p) => p.street_name === streetName);

    return streetPoints.slice(0, -1).map((point, index) => {
      const nextPoint = streetPoints[index + 1];
      const segments = interpolatePoints(point, nextPoint, 10);

      return segments.slice(0, -1).map((segStart, segIndex) => {
        const segEnd = segments[segIndex + 1];
        return (
          <Polyline
            key={`${streetName}-line-${index}-${segIndex}`}
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
    <div
      style={{
        position: "relative",
        height: height || "500px",
        width: width || "100%",
      }}
    >
      <ControlPanel
        showMarkers={showMarkers}
        showPolylines={showPolylines}
        onToggleMarkers={() => setShowMarkers((prev) => !prev)}
        onTogglePolylines={() => setShowPolylines((prev) => !prev)}
      />
      <div style={{ height: "100%", width: "100%", position: "relative" }}>
        <LeafletMap height="100%" width="100%">
          {showPolylines &&
            streetNames.map((streetName) => (
              <React.Fragment key={streetName}>
                {renderStreetLines(streetName)}
              </React.Fragment>
            ))}

          {showMarkers &&
            points.map((pt) => (
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
                    <strong>Street:</strong> {pt.street_name} <br />
                    <strong>Barangay:</strong> {pt.barangay_name} <br />
                    <strong>Lux:</strong> {pt.lux} lx <br />
                    <strong>Location:</strong> [{pt.lat.toFixed(6)},{" "}
                    {pt.lon.toFixed(6)}]
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
