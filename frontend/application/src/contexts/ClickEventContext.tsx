import React, { createContext, useContext, useState } from "react";

// Create a shared context to manage UI click events prioritization
interface ClickEventContextType {
  isStreetClick: boolean;
  setIsStreetClick: (value: boolean) => void;
}

export const ClickEventContext = createContext<ClickEventContextType>({
  isStreetClick: false,
  setIsStreetClick: () => {},
});

export function useClickEventContext() {
  return useContext(ClickEventContext);
}

export function ClickEventProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isStreetClick, setIsStreetClick] = useState(false);

  return (
    <ClickEventContext.Provider value={{ isStreetClick, setIsStreetClick }}>
      {children}
    </ClickEventContext.Provider>
  );
}
