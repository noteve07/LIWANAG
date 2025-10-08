import React, { createContext, useContext, useEffect, useState } from 'react';
import type { PointData } from '../components/Map/types/mapTypes';

interface IlluminationDataContextType {
  points: PointData[];
  streetNames: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const IlluminationDataContext = createContext<IlluminationDataContextType | undefined>(undefined);

export const IlluminationDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [points, setPoints] = useState<PointData[]>([]);
  const [streetNames, setStreetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIlluminationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if running in development mode to use local backend
      const isLocalDev = window.location.hostname === 'localhost';
      
      // First try the v2 endpoint regardless of environment
      let baseUrl = isLocalDev
        ? 'http://127.0.0.1:8000/api/v1/illumination-data-demo-v2'
        : 'https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2';
      
      console.log(`🔄 Attempting to fetch data from v2 endpoint: ${baseUrl}`);
      let response = await fetch(baseUrl);
      
      // If v2 endpoint fails in production, fallback to v1
      if (!response.ok && !isLocalDev) {
        baseUrl = 'https://liwanag-backend.onrender.com/api/v1/illumination-data-demo';
        console.log(`⚠️ V2 endpoint not available, falling back to v1: ${baseUrl}`);
        response = await fetch(baseUrl);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.data && Array.isArray(result.data)) {
        setPoints(result.data);
        
        // Extract unique street IDs (since we're using street_id instead of street_name)
        const uniqueStreetIds = [
          ...new Set(result.data.map((p: PointData) => `Street ${p.street_id}`)),
        ] as string[];
        setStreetNames(uniqueStreetIds);
        
        console.log(`✅ Loaded ${result.data.length} illumination points from backend (cached globally)`);
      } else {
        throw new Error('Invalid data format received from API');
      }
    } catch (err) {
      console.error('❌ Error fetching illumination data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load illumination data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on context initialization (app load)
  useEffect(() => {
    console.log('🌍 IlluminationDataProvider mounted - fetching global data...');
    fetchIlluminationData();
  }, []);

  const refetch = async () => {
    console.log('🔄 Manual refetch requested...');
    await fetchIlluminationData();
  };

  return (
    <IlluminationDataContext.Provider
      value={{
        points,
        streetNames,
        loading,
        error,
        refetch,
      }}
    >
      {children}
    </IlluminationDataContext.Provider>
  );
};

export const useIlluminationData = () => {
  const context = useContext(IlluminationDataContext);
  if (context === undefined) {
    throw new Error('useIlluminationData must be used within an IlluminationDataProvider');
  }
  return context;
};
