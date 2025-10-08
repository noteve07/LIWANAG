import { useRef } from "react";
import { MapClickContext } from "./MapClickContext";

// Provider component that makes the click context available to children
export function MapClickProvider({ children }: { children: React.ReactNode }) {
  // Use a ref instead of state to avoid re-renders and ensure immediate access
  const isClickOnStreet = useRef<boolean>(false);
  
  return (
    <MapClickContext.Provider value={{ isClickOnStreet }}>
      {children}
    </MapClickContext.Provider>
  );
}