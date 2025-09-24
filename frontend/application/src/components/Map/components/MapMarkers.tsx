import React, { useMemo } from "react";
import { Marker, Popup, Tooltip } from "react-leaflet";
import type { PointData } from "../types/mapTypes";
import { createLightIcon } from "../utils/mapUtils";
import { ZOOM_THRESHOLDS } from "../constants/mapConstants";

interface MapMarkersProps {
  points: PointData[];
  showMarkers: boolean;
  zoom: number;
  isPointInViewport?: (lat: number, lon: number) => boolean;
}

export const MapMarkers = ({ points, showMarkers, zoom, isPointInViewport }: MapMarkersProps) => {
  // Show markers when toggle is ON AND zoom >= 17 (automatic zoom behavior)
  if (!showMarkers) {
    return null;
  }
  
  // Automatic hide when zoomed out (but user can still toggle)
  if (zoom < ZOOM_THRESHOLDS.MARKERS_MIN) {
    return null;
  }

  // Filter points to only show those in the current viewport
  const visiblePoints = useMemo(() => {
    if (!isPointInViewport) {
      return points; // If no viewport filtering, show all points
    }
    
    const filtered = points.filter(pt => isPointInViewport(pt.lat, pt.lon));
    
    console.log(`📍 Rendering ${filtered.length}/${points.length} markers in viewport`);
    return filtered;
  }, [points, isPointInViewport]);

  return (
    <>
      {visiblePoints.map((pt) => (
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
    </>
  );
};
