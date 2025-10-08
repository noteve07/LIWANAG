import React, { createContext, useContext, useEffect, useState } from "react";
import type { PointData } from "../components/Map/types/mapTypes";

interface IlluminationDataContextType {
  points: PointData[];
  streetNames: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const IlluminationDataContext = createContext<
  IlluminationDataContextType | undefined
>(undefined);

export const IlluminationDataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [points, setPoints] = useState<PointData[]>([]);
  const [streetNames, setStreetNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIlluminationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Always use the hosted backend
      let baseUrl =
        "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2";

      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Fetch timeout - took more than 10 seconds")),
          10000
        );
      });

      console.log(`🔄 Attempting to fetch data from v2 endpoint: ${baseUrl}`);

      // Race between the fetch and the timeout
      let response;
      try {
        response = (await Promise.race([
          fetch(baseUrl),
          timeoutPromise,
        ])) as Response;
      } catch (timeoutError) {
        console.log(
          `⚠️ V2 endpoint timed out after 10 seconds, using fallback data`
        );
        throw timeoutError;
      }

      // If v2 endpoint fails, fallback to v1
      if (!response.ok) {
        baseUrl =
          "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo";
        console.log(
          `⚠️ V2 endpoint not available, falling back to v1: ${baseUrl}`
        );

        try {
          response = (await Promise.race([
            fetch(baseUrl),
            timeoutPromise,
          ])) as Response;
        } catch (timeoutError) {
          console.log(
            `⚠️ V1 endpoint timed out after 10 seconds, using fallback data`
          );
          throw timeoutError;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Handle both formats: {data: [...]} and direct array format [...]
      const dataArray = Array.isArray(result)
        ? result
        : result.data && Array.isArray(result.data)
        ? result.data
        : null;

      if (dataArray) {
        setPoints(dataArray);

        // Extract unique street IDs (since we're using street_id instead of street_name)
        const uniqueStreetIds = [
          ...new Set(dataArray.map((p: PointData) => `Street ${p.street_id}`)),
        ] as string[];
        setStreetNames(uniqueStreetIds);

        console.log(
          `✅ Loaded ${dataArray.length} illumination points from backend (cached globally)`
        );
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (err) {
      console.error("❌ Error fetching illumination data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load illumination data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on context initialization (app load)
  useEffect(() => {
    console.log(
      "🌍 IlluminationDataProvider mounted - fetching global data..."
    );
    fetchIlluminationData();
  }, []);

  const refetch = async () => {
    console.log("🔄 Manual refetch requested...");
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
    throw new Error(
      "useIlluminationData must be used within an IlluminationDataProvider"
    );
  }
  return context;
};
