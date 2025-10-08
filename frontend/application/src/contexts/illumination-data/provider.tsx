import React, { useEffect, useState } from "react";
import { IlluminationDataContext } from "./context";
import type { PointData } from "../../components/Map/types/mapTypes";
import fallbackData from "../../assets/fallback/illumination_data_v2_fallback.json";

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
      let result;

      try {
        // First try the v2 endpoint with timeout
        let baseUrl =
          "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo-v2";

        console.log(`🔄 Attempting to fetch data from v2 endpoint: ${baseUrl}`);

        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () =>
              reject(new Error("Fetch timeout - took more than 10 seconds")),
            10000
          );
        });

        // Race between the fetch and the timeout
        let response = (await Promise.race([
          fetch(baseUrl),
          timeoutPromise,
        ])) as Response;

        // If v2 endpoint fails or times out, fallback to v1
        if (!response.ok) {
          baseUrl =
            "https://liwanag-backend.onrender.com/api/v1/illumination-data-demo";
          console.log(
            `⚠️ V2 endpoint not available, falling back to v1: ${baseUrl}`
          );
          // Try v1 with timeout
          response = (await Promise.race([
            fetch(baseUrl),
            timeoutPromise,
          ])) as Response;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        result = await response.json();
      } catch (error) {
        // If remote API calls fail or timeout, try fallback data
        console.log(
          "⚠️ API fetch failed or timed out, falling back to embedded data..."
        );

        try {
          // Use the imported fallback data as last resort
          console.log("✅ Using embedded fallback data");
          result = fallbackData;
        } catch (embeddedError) {
          console.error("❌ Embedded fallback data failed:", embeddedError);
          throw new Error(
            "All data sources failed. Check network connection and CORS settings."
          );
        }
      }

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
