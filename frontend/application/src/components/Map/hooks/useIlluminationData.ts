import { useState, useEffect } from "react";
import type { PointData } from "../types/mapTypes";

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
        
        // Try v2 endpoint first, fall back to v1 if it fails
        let url = 'http://127.0.0.1:8000/api/v1/illumination-data-demo-v2';
        console.log(`Trying to fetch from: ${url}`);
        
        try {
          const v2Response = await fetch(url);
          if (!v2Response.ok) {
            console.log(`V2 endpoint failed with status ${v2Response.status}, trying v1 endpoint...`);
            url = 'http://127.0.0.1:8000/api/v1/illumination-data-demo';
          }
        } catch (e) {
          console.log(`Error with v2 endpoint: ${e}, trying v1 endpoint...`);
          url = 'http://127.0.0.1:8000/api/v1/illumination-data-demo';
        }
        
        const response = await fetch(url);
        
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
          
          console.log(`Loaded ${result.data.length} illumination points from demo dataset`);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching illumination data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load illumination data');
      } finally {
        setLoading(false);
      }
    };

    fetchIlluminationData();
  }, []);

  return { points, streetNames, loading, error };
};
