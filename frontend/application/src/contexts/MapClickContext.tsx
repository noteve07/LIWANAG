import { MutableRefObject, createContext, useContext, useRef } from "react";

// Create a shared DOM event tracking context that components can use
// to determine if a click originated from a polyline

interface MapClickContext {
  isClickOnStreet: MutableRefObject<boolean>;
}

export const MapClickContext = createContext<MapClickContext>({
  isClickOnStreet: { current: false },
});

export function useMapClickContext() {
  return useContext(MapClickContext);
}

export function MapClickProvider({ children }: { children: React.ReactNode }) {
  // Use a ref instead of state to avoid re-renders and ensure immediate access
  const isClickOnStreet = useRef<boolean>(false);
  
  return (
    <MapClickContext.Provider value={{ isClickOnStreet }}>
      {children}
    </MapClickContext.Provider>
  );
}