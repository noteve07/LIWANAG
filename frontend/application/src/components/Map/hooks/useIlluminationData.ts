import { useState, useEffect } from "react";
import type { PointData } from "../types/mapTypes";
import fallbackData from "../../../assets/fallback/illumination_data_v2_fallback.json";

export const useIlluminationData = () => {
  const [points, setPoints] = useState<PointData[]>([]);
  const [streetNames, setStreetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIlluminationData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if running in development mode to use local backend
        const isLocalDev = window.location.hostname === "localhost";
        let result;
        
        try {
          // Use the appropriate URL based on the environment
          const baseUrl = isLocalDev
            ? "http://127.0.0.1:8000/api/v1/illumination-data-demo-v2"
            : "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2";
          
          console.log(`🔄 Attempting to fetch data from: ${baseUrl}`);
          const response = await fetch(baseUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          result = await response.json();
        } catch (fetchError) {
          // If remote API call fails (likely CORS issue in development), fallback to local JSON
          if (isLocalDev) {
            console.log("⚠️ API fetch failed, attempting to load local fallback data...");
            
            try {
              // Attempt to load a local fallback file
              const fallbackResponse = await fetch('/illumination_demo_data.json');
              
              if (!fallbackResponse.ok) {
                throw new Error(`Failed to load local fallback data: ${fallbackResponse.status}`);
              }
              
              console.log("✅ Loaded local fallback data successfully");
              result = await fallbackResponse.json();
            } catch (fallbackError) {
              console.log("⚠️ Local fallback failed, trying embedded fallback data...");
              
              try {
                // Use the embedded fallback data
                console.log("✅ Using embedded fallback data");
                result = fallbackData;
              } catch (embeddedError) {
                console.log("⚠️ Embedded fallback failed, trying CORS proxy as last resort...");
                
                try {
                  // Try using a CORS proxy as last resort
                  const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
                    "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2"
                  )}`;
                  
                  const proxyResponse = await fetch(corsProxyUrl);
                  
                  if (!proxyResponse.ok) {
                    throw new Error(`CORS proxy request failed: ${proxyResponse.status}`);
                  }
                  
                  console.log("✅ Successfully loaded data through CORS proxy");
                  result = await proxyResponse.json();
                } catch (proxyError) {
                  console.error("❌ All data sources failed:", proxyError);
                  throw new Error("All data sources failed. Check network connection and CORS settings.");
                }
              }
            }
          } else {
            // In production, try using the embedded fallback data before giving up
            console.log("⚠️ API fetch failed in production, using embedded fallback data...");
            
            try {
              // Use the embedded fallback data
              console.log("✅ Using embedded fallback data in production");
              result = fallbackData;
            } catch (embeddedError) {
              console.error("❌ Embedded fallback data failed:", embeddedError);
              // Finally throw the original error if everything fails
              throw fetchError;
            }
          }
        }
        
        if (result.data && Array.isArray(result.data)) {
          setPoints(result.data);
          
          // Extract unique street IDs (since we're using street_id instead of street_name)
          const uniqueStreetIds = [
            ...new Set(result.data.map((p: PointData) => `Street ${p.street_id}`)),
          ] as string[];
          setStreetNames(uniqueStreetIds);
          
          console.log(`✅ Loaded ${result.data.length} illumination points from backend`);
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

    fetchIlluminationData();
  }, []);

  return { points, streetNames, loading, error };
};
