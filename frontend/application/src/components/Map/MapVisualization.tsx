import { useEffect, useState } from "react";
import LeafletMap from "./LeafletMap";
import type { MapVisualizationProps } from "./types/mapTypes";
import { useIlluminationData } from "./hooks/useIlluminationData";
import { useZoomTracking } from "./hooks/useZoomTracking";
import { ZoomTracker } from "./components/ZoomTracker";
import { MapControls } from "./components/MapControls";
import { MapMarkers } from "./components/MapMarkers";
import { MapPolylines } from "./components/MapPolylines";



function MapVisualization({ height, width }: MapVisualizationProps) {
  // Custom hooks
  const { points, streetNames, loading, error } = useIlluminationData();
  const { zoom, handleZoomChange } = useZoomTracking();
  
  // Local state
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPolylines, setShowPolylines] = useState(true);

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
      <MapControls
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
           
           <MapPolylines 
             streetNames={streetNames}
             showPolylines={showPolylines}
             zoom={zoom}
             points={points}
           />
           
           <MapMarkers 
             points={points}
             showMarkers={showMarkers}
             zoom={zoom}
           />
        </LeafletMap>
      </div>
    </div>
  );
}

export default MapVisualization;
