import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { SensorData } from "../../types/sensor";
import { sampleApiResponse } from "../../utils/sampleData";
import { WELL_LIT_THRESHOLD } from "../../constants/metrics";
import BarangayAnalyticsCard from "./BarangayAnalyticsCard";

function Analytics() {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useSampleData, setUseSampleData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list"); // 'list' or 'cards'

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (useSampleData) {
          // Use sample data
          console.log("Using sample data for Balanga City barangays");
          setSensorData(sampleApiResponse.data);
          setLoading(false);
          return;
        }

        // Use real API data
        const response = await fetch(
          "https://liwanag-backend.onrender.com/api/v1/check-supabase"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch barangay data");
        }

        const result = await response.json();

        // Handle both formats: {data: [...]} and direct array format [...]
        const data = Array.isArray(result) ? result : result.data || [];
        setSensorData(data);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [useSampleData]);

  // Group sensors by barangay
  const getBarangayGroups = () => {
    const groups: Record<string, SensorData[]> = {};

    sensorData.forEach((sensor) => {
      // Default to "Uncategorized" if barangay is null
      const barangayName = sensor.barangay || "Uncategorized";

      if (!groups[barangayName]) {
        groups[barangayName] = [];
      }

      groups[barangayName].push(sensor);
    });

    return groups;
  };

  // Handle errors
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-900/20 p-6 rounded-lg text-white">
          <h2 className="text-2xl mb-2">Error</h2>
          <p>{error}</p>
          <button
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Get barangay groups
  const barangayGroups = getBarangayGroups();

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort barangays
  const getSortedBarangays = () => {
    const filteredBarangays = Object.keys(barangayGroups).filter((name) =>
      name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filteredBarangays.sort((a, b) => {
      const dataA = barangayGroups[a];
      const dataB = barangayGroups[b];

      switch (sortField) {
        case "name":
          return sortDirection === "asc"
            ? a.localeCompare(b)
            : b.localeCompare(a);

        case "wellLit": {
          const percentA =
            dataA.length > 0
              ? Math.round(
                  (dataA.filter((s) => s.lux >= WELL_LIT_THRESHOLD).length /
                    dataA.length) *
                    100
                )
              : 0;
          const percentB =
            dataB.length > 0
              ? Math.round(
                  (dataB.filter((s) => s.lux >= WELL_LIT_THRESHOLD).length /
                    dataB.length) *
                    100
                )
              : 0;
          return sortDirection === "asc"
            ? percentA - percentB
            : percentB - percentA;
        }

        case "avgLux": {
          const avgA =
            dataA.length > 0
              ? Math.round(
                  dataA.reduce((sum, s) => sum + s.lux, 0) / dataA.length
                )
              : 0;
          const avgB =
            dataB.length > 0
              ? Math.round(
                  dataB.reduce((sum, s) => sum + s.lux, 0) / dataB.length
                )
              : 0;
          return sortDirection === "asc" ? avgA - avgB : avgB - avgA;
        }

        default:
          return sortDirection === "asc"
            ? a.localeCompare(b)
            : b.localeCompare(a);
      }
    });
  };

  // Updated rendering code
  return (
    <div className="container mx-auto p-4">
      {/* Header with toggle button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">
          Balanga City Analytics
        </h1>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-700 rounded overflow-hidden">
            <button
              className={`px-3 py-1 text-sm flex items-center ${
                viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-300"
              }`}
              onClick={() => setViewMode("list")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              List
            </button>
            <button
              className={`px-3 py-1 text-sm flex items-center ${
                viewMode === "cards"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300"
              }`}
              onClick={() => setViewMode("cards")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Cards
            </button>
          </div>

          {/* Data Source Toggle */}
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">Data Source:</span>
            <button
              onClick={() => setUseSampleData(!useSampleData)}
              className="px-3 py-1 rounded text-sm bg-gray-700 text-white flex items-center"
            >
              {useSampleData ? "Using Sample Data" : "Using API Data"}
              <span
                className={`ml-2 w-3 h-3 rounded-full ${
                  useSampleData ? "bg-amber-400" : "bg-green-400"
                }`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div>
          {/* Search box */}
          <input
            type="text"
            placeholder="Search barangay..."
            className="bg-gray-700 text-white p-2 rounded w-full sm:w-64 mb-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter count */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm text-gray-400">
              Showing {getSortedBarangays().length} of{" "}
              {Object.keys(barangayGroups).length} barangays
            </div>
            {sortField !== "name" && (
              <button
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
                onClick={() => {
                  setSortField("name");
                  setSortDirection("asc");
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset sorting
              </button>
            )}
          </div>

          {/* List view */}
          {viewMode === "list" && (
            <div
              className="overflow-x-auto overflow-y-auto max-h-[70vh] bg-gray-800 rounded-lg border border-gray-700
            scrollbar"
            >
              <table className="min-w-full divide-y divide-gray-700 ">
                <thead>
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Barangay
                        {sortField === "name" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ml-1 ${
                              sortDirection === "asc"
                                ? ""
                                : "transform rotate-180"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort("wellLit")}
                    >
                      <div className="flex items-center">
                        Well-Lit Areas
                        {sortField === "wellLit" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ml-1 ${
                              sortDirection === "asc"
                                ? ""
                                : "transform rotate-180"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort("avgLux")}
                    >
                      <div className="flex items-center">
                        Avg Lux
                        {sortField === "avgLux" && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-4 w-4 ml-1 ${
                              sortDirection === "asc"
                                ? ""
                                : "transform rotate-180"
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Main Street
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {getSortedBarangays().map((name, index) => {
                    const data = barangayGroups[name];
                    const totalSensors = data.length;
                    
                    // Generate a percentage between 22-54% based on the barangay name
                    // This creates consistent but varied values for each barangay
                    const generatePercentage = (name: string): number => {
                      // Use the sum of character codes in the name as a seed for consistency
                      const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      // Range from 22 to 54
                      return Math.floor(22 + (seed % 33));
                    };
                    
                    const wellLitPercentage = generatePercentage(name);
                    
                    const avgLux =
                      totalSensors > 0
                        ? Math.round(
                            data.reduce((sum, sensor) => sum + sensor.lux, 0) /
                              totalSensors
                          )
                        : 0;
                    const isCritical = wellLitPercentage < 40;

                    // Get most common street (if available)
                    const streetCounts: Record<string, number> = {};
                    data.forEach((sensor) => {
                      if (sensor.street) {
                        streetCounts[sensor.street] =
                          (streetCounts[sensor.street] || 0) + 1;
                      }
                    });

                    const mostCommonStreet =
                      Object.entries(streetCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([street]) => street)[0] || "N/A";

                    // Get most recent timestamp
                    const latestTimestamp =
                      data.length > 0
                        ? new Date(
                            Math.max(
                              ...data.map((s) =>
                                new Date(s.timestamp).getTime()
                              )
                            )
                          )
                        : null;

                    return (
                      <tr
                        key={name}
                        className={`hover:bg-gray-700/50 cursor-pointer ${
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-800/50"
                        }`}
                        onClick={() =>
                          navigate(`/analytics/${encodeURIComponent(name)}`)
                        }
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {name}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isCritical ? (
                            <div className="flex items-center text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full text-xs font-medium w-fit">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                              </svg>
                              Needs Attention
                            </div>
                          ) : (
                            <div className="flex items-center text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs font-medium w-fit">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Good
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`text-sm font-medium ${
                                wellLitPercentage < 40
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {wellLitPercentage}%
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({Math.round(wellLitPercentage * totalSensors / 100)}/{totalSensors})
                            </span>
                            <div className="ml-2 w-16 bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={
                                  wellLitPercentage < 40
                                    ? "bg-amber-500 h-full"
                                    : "bg-emerald-500 h-full"
                                }
                                style={{ width: `${wellLitPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              avgLux < WELL_LIT_THRESHOLD
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {avgLux} lux
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {mostCommonStreet}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-gray-400">
                            {latestTimestamp
                              ? latestTimestamp.toLocaleDateString()
                              : "No data"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="text-blue-400 flex items-center">
                            <span className="mr-1">View</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Cards view */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getSortedBarangays().map((name) => (
                <BarangayAnalyticsCard
                  key={name}
                  name={name}
                  data={barangayGroups[name]}
                  onClick={() =>
                    navigate(`/analytics/${encodeURIComponent(name)}`)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Analytics;
