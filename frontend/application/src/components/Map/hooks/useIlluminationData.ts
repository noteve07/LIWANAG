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
        
        // Always use the hosted backend
        let result;
        
        // Try API call first
        try {
          const baseUrl = "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2";
          console.log(`🔄 Attempting to fetch data from: ${baseUrl}`);
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Fetch timeout - took more than 10 seconds")), 10000);
          });
          
          const response = await Promise.race([
            fetch(baseUrl),
            timeoutPromise
          ]) as Response;
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          result = await response.json();
          console.log("✅ Successfully loaded data from API");
        } catch (apiError) {
          console.log("⚠️ API fetch failed:", apiError instanceof Error ? apiError.message : "Unknown error");
          console.log("Trying local fallback...");
          
          // Try local fallback file
          try {
            const fallbackResponse = await fetch('/illumination_demo_data.json');
            
            if (!fallbackResponse.ok) {
              throw new Error(`Failed to load local fallback data: ${fallbackResponse.status}`);
            }
            
            result = await fallbackResponse.json();
            console.log("✅ Loaded local fallback data successfully");
          } catch (localFallbackError) {
            console.log("⚠️ Local fallback failed:", localFallbackError instanceof Error ? localFallbackError.message : "Unknown error");
            console.log("Using embedded fallback...");
            
            // Try embedded fallback
            try {
              result = fallbackData;
              console.log("✅ Using embedded fallback data");
            } catch (embeddedError) {
              console.log("⚠️ Embedded fallback failed:", embeddedError instanceof Error ? embeddedError.message : "Unknown error");
              console.log("Trying CORS proxy as last resort...");
              
              // Try CORS proxy as last resort
              try {
                const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(
                  "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2"
                )}`;
                
                const proxyResponse = await fetch(corsProxyUrl);
                
                if (!proxyResponse.ok) {
                  throw new Error(`CORS proxy request failed: ${proxyResponse.status}`);
                }
                
                result = await proxyResponse.json();
                console.log("✅ Successfully loaded data through CORS proxy");
              } catch (proxyError) {
                console.error("❌ All data sources failed:", proxyError instanceof Error ? proxyError.message : "Unknown error");
                throw new Error("All data sources failed. Check network connection and CORS settings.");
              }
            }
          }
        }
        
        // Process the data once we have it from any source
        const dataArray = Array.isArray(result) ? result : (result.data && Array.isArray(result.data) ? result.data : null);
        
        if (dataArray) {
          setPoints(dataArray);
          
          // Extract unique street IDs
          const uniqueStreetIds = [
            ...new Set(dataArray.map((p: PointData) => `Street ${p.street_id}`)),
          ] as string[];
          setStreetNames(uniqueStreetIds);
          
          console.log(`✅ Loaded ${dataArray.length} illumination points`);
        } else {
          throw new Error('Invalid data format received');
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
