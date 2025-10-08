import { useEffect, useState } from "react";
import LeafletMap from "./LeafletMap";
import type { MapVisualizationProps } from "./types/mapTypes";
import { useIlluminationData } from "../../contexts/useIlluminationData";
import { useZoomTracking } from "./hooks/useZoomTracking";
import { useViewportBounds } from "./hooks/useViewportBounds";
import { ZoomTracker } from "./components/ZoomTracker";
import { ViewportTracker } from "./components/ViewportTracker";
import { MapControls } from "./components/MapControls";
import { MapMarkers } from "./components/MapMarkers";
import { MapPolylines } from "./components/MapPolylines";
import { UnsurveyedStreets } from "./components/UnsurveyedStreets";
import { PartiallyUnsurveyedStreets } from "./components/PartiallyUnsurveyedStreets";
import { BarangayBoundaries } from "./components/BarangayBoundaries";
import { BarangayClickHandler } from "./components/BarangayClickHandler";
import { filterPointsByBarangay } from "./utils/barangayUtils";
import type { BarangayData } from "./utils/barangayUtils";
import LoadingScreen from "../LoadingScreen";
import { MapClickProvider } from "../../contexts/MapClickProvider";

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
    type: "surveyed" | "unsurveyed" | "partial";
    averageLux?: number;
  } | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayData | null>(
    null
  );

  // Click handling state to prevent barangay clicks when streets are clicked
  const [isStreetClick, setIsStreetClick] = useState(false);

  // Handle street selection
  const handleStreetClick = (
    streetId: number,
    streetName: string,
    type: "surveyed" | "unsurveyed" | "partial",
    averageLux?: number
  ) => {
    // Set flag to prevent barangay selection
    setIsStreetClick(true);

    setSelectedStreet({
      id: streetId,
      name: streetName,
      type,
      averageLux,
    });
  };

  // Handle barangay selection
  const handleBarangaySelect = (barangay: BarangayData | null) => {
    // Don't select barangay if we just clicked a street
    if (isStreetClick) {
      setIsStreetClick(false);
      return;
    }

    setSelectedBarangay(barangay);
    // Clear street selection when barangay is selected
    if (barangay) {
      setSelectedStreet(null);
    }
  };

  // Filter data based on selected barangay
  const filteredPoints = filterPointsByBarangay(points, selectedBarangay);
  const filteredStreetNames = selectedBarangay
    ? streetNames.filter((streetName) => {
        // Extract street ID from street name (format: "Street {id}")
        const streetId = parseInt(streetName.replace("Street ", ""));
        const streetPoints = points.filter((p) => p.street_id === streetId);
        return streetPoints.some((point) =>
          filteredPoints.some((filteredPoint) => filteredPoint.id === point.id)
        );
      })
    : streetNames;

  // CSS for markers and popups
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
      
      /* Custom popup styling */
      .leaflet-popup-content-wrapper {
        background: transparent !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 0 !important;
        min-width: 0 !important;
      }
      .leaflet-popup-tip {
        background: rgba(10, 15, 25, 0.98) !important;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3) !important;
      }
      .leaflet-popup-close-button {
        color: #f59e0b !important;
        opacity: 0.9;
        font-size: 18px !important;
        top: 5px !important;
        right: 5px !important;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
      .leaflet-popup-close-button:hover {
        color: white !important;
        opacity: 1;
      }
      
      /* Custom tooltip styling */
      .custom-tooltip .leaflet-tooltip {
        background: rgba(5, 10, 20, 0.98) !important;
        border: none !important;
        color: white !important;
        font-weight: 600;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 13px;
      }
      .custom-tooltip .leaflet-tooltip-top:before {
        border-top-color: rgba(5, 10, 20, 0.98) !important;
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
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(245,158,11,0.3) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div
              className="absolute inset-0 w-20 h-20 border-4 border-amber-400/30 rounded-full animate-spin"
              style={{
                borderTopColor: "#f59e0b",
                animationDuration: "2s",
              }}
            ></div>
          </div>

          {/* Loading Text */}
          <div className="text-center space-y-1">
            <h3 className="text-lg font-medium text-white">Loading...</h3>
          </div>

          {/* Progress Dots */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
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
      <div
        style={{
          height: "100%",
          width: "100%",
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
        }}
      >
        <MapClickProvider>
          <LeafletMap height="100%" width="100%">
            <ZoomTracker onZoomChange={handleZoomChange} />
            <ViewportTracker onBoundsChange={updateBounds} />
            <BarangayClickHandler
              onBarangaySelect={handleBarangaySelect}
              selectedBarangay={selectedBarangay}
            />

            <BarangayBoundaries selectedBarangay={selectedBarangay} />

            <UnsurveyedStreets
              points={filteredPoints}
              showPolylines={showPolylines}
              selectedStreetId={selectedStreet?.id}
              onStreetClick={handleStreetClick}
            />

            <PartiallyUnsurveyedStreets
              points={filteredPoints}
              showPolylines={showPolylines}
              selectedStreetId={selectedStreet?.id}
              onStreetClick={handleStreetClick}
            />

            <MapPolylines
              streetNames={filteredStreetNames}
              showPolylines={showPolylines}
              points={filteredPoints}
              selectedStreetId={selectedStreet?.id}
              onStreetClick={handleStreetClick}
            />

            <MapMarkers
              points={filteredPoints}
              showMarkers={showMarkers}
              zoom={zoom}
              isPointInViewport={isPointInViewport}
              onStreetClick={handleStreetClick}
              streetNames={filteredStreetNames}
            />
          </LeafletMap>
        </MapClickProvider>

        {/* Barangay Details Overlay */}
        {selectedBarangay && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              zIndex: 1000,
              background: "rgba(17, 25, 38, 0.95)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              minWidth: "250px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e40af",
                }}
              >
                Barangay Details
              </h3>
              <button
                onClick={() => setSelectedBarangay(null)}
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
                <strong>Name:</strong> {selectedBarangay.name}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>ID:</strong> {selectedBarangay.id}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Data Points:</strong> {filteredPoints.length} markers
              </div>
              <div style={{ marginBottom: "8px" }}>
                <strong>Streets:</strong> {filteredStreetNames.length} streets
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginTop: "12px",
                }}
              >
                Click another area to select a different barangay or click here
                to clear
              </div>
            </div>
          </div>
        )}

        {/* Street Details Overlay */}
        {selectedStreet && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              zIndex: 1000,
              background: "rgba(17, 25, 38, 0.95)",
              border: "1px solid rgba(30, 64, 175, 0.4)",
              borderRadius: "8px",
              padding: "16px",
              minWidth: "250px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              color: "white",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e40af" }}>
                Street Details
              </h3>
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
                <span
                  style={{
                    color: "#1e40af",
                    fontWeight: "500"
                  }}
                >
                  {selectedStreet.type === "surveyed"
                    ? "Fully Surveyed"
                    : selectedStreet.type === "partial"
                    ? "Partially Surveyed"
                    : "Unsurveyed"}
                </span>
              </div>
              {selectedStreet.averageLux && (
                <div style={{ marginBottom: "8px" }}>
                  <strong>Average Lux:</strong>{" "}
                  {selectedStreet.averageLux.toFixed(1)} lx
                </div>
              )}
              <div
                style={{
                  fontSize: "12px",
                  color: "#9ca3af",
                  marginTop: "12px",
                }}
              >
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
