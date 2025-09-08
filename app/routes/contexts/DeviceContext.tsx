import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMediaQuery } from "react-responsive";

// Create a Device Context
const DeviceContext = createContext();

// Device Provider Component
export function DeviceProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Only provide the actual value after component has mounted
  const value = isMounted ? isMobile : false;
  
  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

// Custom hook to use the device context
export function useDevice() {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}