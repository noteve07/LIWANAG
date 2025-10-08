import { useContext } from "react";
import { MapClickContext } from "./MapClickContext";

// Hook for consuming the MapClickContext
export function useMapClickContext() {
  return useContext(MapClickContext);
}