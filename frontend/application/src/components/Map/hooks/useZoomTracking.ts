import { useState } from "react";
import { MAP_CONFIG } from "../constants/mapConstants";

export const useZoomTracking = () => {
  const [zoom, setZoom] = useState<number>(MAP_CONFIG.DEFAULT_ZOOM);

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    console.log(`Zoom level: ${newZoom}`);
  };

  return { zoom, handleZoomChange };
};
