import { useMemo } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import type { PointData } from "../types/mapTypes";
import { createLightIcon, getLuxColor } from "../utils/mapUtils";
import { ZOOM_THRESHOLDS } from "../constants/mapConstants";

interface MapMarkersProps {
  points: PointData[];
  showMarkers: boolean;
  zoom: number;
  isPointInViewport?: (lat: number, lon: number) => boolean;
  onStreetClick?: (
    streetId: number,
    streetName: string,
    type: "surveyed" | "unsurveyed" | "partial",
    averageLux?: number
  ) => void;
  streetNames?: string[];
}

export const MapMarkers = ({ 
  points, 
  showMarkers, 
  zoom, 
  isPointInViewport,
  onStreetClick,
  streetNames = []
}: MapMarkersProps) => {
  // Filter points to only show those in the current viewport
  const visiblePoints = useMemo(() => {
    if (!isPointInViewport) {
      return points; // If no viewport filtering, show all points
    }
    
    const filtered = points.filter(pt => isPointInViewport(pt.lat, pt.lon));
    
    console.log(`📍 Rendering ${filtered.length}/${points.length} markers in viewport`);
    return filtered;
  }, [points, isPointInViewport]);
  
  // Helper to find street name from street ID
  const findStreetName = (streetId: number): string => {
    // Extract street ID from the streetName (format: "Street X")
    const streetName = streetNames.find(name => {
      const id = parseInt(name.replace("Street ", ""));
      return id === streetId;
    });
    return streetName || `Street ${streetId}`;
  };
  
  // Function to highlight street when marker is clicked
  const handleMarkerClick = (point: PointData) => {
    if (onStreetClick && point.street_id) {
      // Get all points for this street to calculate average lux
      const streetPoints = points.filter(p => p.street_id === point.street_id);
      const averageLux = streetPoints.reduce((sum, p) => sum + p.lux, 0) / streetPoints.length;
      
      // Find street name
      const streetName = findStreetName(point.street_id);
      
      // Call the street click handler
      onStreetClick(point.street_id, streetName, "surveyed", averageLux);
    }
  };

  // Show markers when toggle is ON AND zoom >= 17 (automatic zoom behavior)
  if (!showMarkers) {
    return null;
  }
  
  // Automatic hide when zoomed out (but user can still toggle)
  if (zoom < ZOOM_THRESHOLDS.MARKERS_MIN) {
    return null;
  }

  return (
    <>
      {visiblePoints.map((pt) => (
        <Marker
          key={pt.id}
          position={[pt.lat, pt.lon]}
          icon={createLightIcon(pt.lux, zoom, pt.classification)}
          eventHandlers={{
            click: () => {
              handleMarkerClick(pt);
            }
          }}
        >
          <Tooltip
            direction="top"
            offset={[0, -10]}
            permanent={false}
            opacity={0.9}
            className="custom-tooltip"
          >
            <span style={{ color: getLuxColor(pt.lux), fontWeight: "500" }}>
              {pt.lux} lx {pt.classification ? `(${pt.classification})` : ''}
            </span>
          </Tooltip>
          <Popup className="modern-popup">
            <div
              style={{
                background: "rgba(17, 25, 38, 0.95)",
                color: "white",
                padding: "10px",
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                minWidth: "180px",
                maxWidth: "250px",
                border: `1px solid ${getLuxColor(pt.lux)}40`,
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Light indicator accent line */}
              <div 
                style={{ 
                  position: "absolute", 
                  top: 0, 
                  left: 0, 
                  height: "4px", 
                  width: "100%", 
                  background: getLuxColor(pt.lux) 
                }} 
              />
              
              <div style={{ marginTop: "4px", marginBottom: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: "600", color: getLuxColor(pt.lux) }}>
                  {pt.lux} lx
                </div>
                {pt.classification && (
                  <div style={{ fontSize: "14px", fontWeight: "500", color: getLuxColor(pt.lux) }}>
                    {pt.classification.replace('_', ' ')}
                  </div>
                )}
              </div>
              
              <div style={{ fontSize: "12px", marginBottom: "4px", color: "#9ca3af" }}>
                <span style={{ color: getLuxColor(pt.lux), fontWeight: "500" }}>Location:</span> {pt.lat.toFixed(6)}, {pt.lon.toFixed(6)}
              </div>
              
              {pt.road_type && (
                <div style={{ fontSize: "12px", marginBottom: "4px", color: "#9ca3af" }}>
                  <span style={{ color: getLuxColor(pt.lux), fontWeight: "500" }}>Road Type:</span> {pt.road_type.replace('_', ' ')}
                </div>
              )}
              
              {pt.created_at && (
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                  <span style={{ color: getLuxColor(pt.lux), fontWeight: "500" }}>Collected:</span> {new Date(pt.created_at).toLocaleString()}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
