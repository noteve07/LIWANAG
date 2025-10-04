import { useEffect, useState } from "react";
import LeafletMap from "./LeafletMap";
import type { MapVisualizationProps } from "./types/mapTypes";
import { useIlluminationData } from "../../contexts/IlluminationDataContext";
import { useZoomTracking } from "./hooks/useZoomTracking";
import { useViewportBounds } from "./hooks/useViewportBounds";
import { ZoomTracker } from "./components/ZoomTracker";
import { ViewportTracker } from "./components/ViewportTracker";
import { MapControls } from "./components/MapControls";
import { MapMarkers } from "./components/MapMarkers";
import { MapPolylines } from "./components/MapPolylines";
import { UnsurveyedStreets } from "./components/UnsurveyedStreets";
import { PartiallyUnsurveyedStreets } from "./components/PartiallyUnsurveyedStreets";
import LoadingScreen from "../LoadingScreen";



function MapVisualization({ height, width }: MapVisualizationProps) {
  // Custom hooks
  const { points, streetNames, loading, error } = useIlluminationData();
  const { zoom, handleZoomChange } = useZoomTracking();
  const { updateBounds, isPointInViewport } = useViewportBounds();
  
  // Local state
  const [showMarkers, setShowMarkers] = useState(true);
  const [showPolylines, setShowPolylines] = useState(true);
  const [selectedStreet, setSelectedStreet] = useState<{
    id: number;
    name: string;
    type: 'surveyed' | 'unsurveyed' | 'partial';
    averageLux?: number;
  } | null>(null);

  // Handle street selection
  const handleStreetClick = (streetId: number, streetName: string, type: 'surveyed' | 'unsurveyed' | 'partial', averageLux?: number) => {
    setSelectedStreet({
      id: streetId,
      name: streetName,
      type,
      averageLux
    });
  };

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
      <div className="h-full w-full bg-gradient-to-b from-[#0D1117] to-[#151B23] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Main Loading Content */}
        <div className="relative z-10 flex flex-col items-center space-y-6">
          {/* Animated Logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg 
                className="w-10 h-10 text-gray-900 animate-pulse" 
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-amber-400/30 rounded-full animate-spin" style={{
              borderTopColor: '#f59e0b',
              animationDuration: '2s'
            }}></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-medium text-white">Loading...</h3>
          </div>
          
          {/* Progress Dots */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
        </div>
      </div>
    );
  }

  // Show error state - display map with alert popup instead of error message
  if (error) {
    return (
      <LoadingScreen 
        showMap={true}
        message="Illumination data is currently unavailable. Showing base map view."
      />
    );
  }

  // Show map with alert if no data is available (but no error)
  if (!loading && (!points || points.length === 0)) {
    return (
      <LoadingScreen 
        showMap={true}
        message="No illumination data found. Install sensors to start collecting data."
      />
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
      }}>
        <LeafletMap height="100%" width="100%">
           <ZoomTracker onZoomChange={handleZoomChange} />
           <ViewportTracker onBoundsChange={updateBounds} />
           
           <UnsurveyedStreets 
             points={points}
             showPolylines={showPolylines}
             selectedStreetId={selectedStreet?.id}
             onStreetClick={handleStreetClick}
           />
           
           <PartiallyUnsurveyedStreets 
             points={points}
             showPolylines={showPolylines}
             selectedStreetId={selectedStreet?.id}
             onStreetClick={handleStreetClick}
           />
           
           <MapPolylines 
             streetNames={streetNames}
             showPolylines={showPolylines}
             points={points}
             selectedStreetId={selectedStreet?.id}
             onStreetClick={handleStreetClick}
           />
           
           <MapMarkers 
             points={points}
             showMarkers={showMarkers}
             zoom={zoom}
             isPointInViewport={isPointInViewport}
           />
        </LeafletMap>
        
        {/* Street Details Overlay */}
        {selectedStreet && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              zIndex: 1000,
              background: "rgba(17, 25, 38, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "16px",
              minWidth: "250px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              color: "white",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>Street Details</h3>
              <button
                onClick={() => setSelectedStreet(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ fontSize: "14px", lineHeight: "1.5" }}>
              <div style={{ marginBottom: "8px" }}>
                <strong>Name:</strong> {selectedStreet.name}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Status:</strong>{" "}
                <span style={{
                  color: selectedStreet.type === 'surveyed' ? '#10b981' : 
                        selectedStreet.type === 'partial' ? '#f59e0b' : '#6b7280'
                }}>
                  {selectedStreet.type === 'surveyed' ? 'Fully Surveyed' :
                   selectedStreet.type === 'partial' ? 'Partially Surveyed' : 'Unsurveyed'}
                </span>
              </div>
              {selectedStreet.averageLux && (
                <div style={{ marginBottom: "8px" }}>
                  <strong>Average Lux:</strong> {selectedStreet.averageLux.toFixed(1)} lx
                </div>
              )}
              <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "12px" }}>
                Click another street to view its details
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapVisualization;
