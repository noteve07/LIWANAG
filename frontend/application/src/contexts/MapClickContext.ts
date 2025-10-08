import { type MutableRefObject, createContext } from "react";

// Create a shared DOM event tracking context that components can use
// to determine if a click originated from a polyline

export interface MapClickContextType {
  isClickOnStreet: MutableRefObject<boolean>;
}

// Default context value (will be properly initialized in provider)
export const MapClickContext = createContext<MapClickContextType>({} as MapClickContextType);