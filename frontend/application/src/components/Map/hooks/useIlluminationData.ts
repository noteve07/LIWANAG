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
        
        // Fetch from the new illumination-data-demo endpoint
        const response = await fetch('http://127.0.0.1:8000/api/v1/illumination-data-demo');
        
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
