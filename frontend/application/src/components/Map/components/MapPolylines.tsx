import React from "react";
import { Polyline } from "react-leaflet";
import type { PointData } from "../types/mapTypes";
import { getLuxColor, calculateDistance, interpolatePoints } from "../utils/mapUtils";
import { ZOOM_THRESHOLDS, MAP_CONFIG } from "../constants/mapConstants";

interface MapPolylinesProps {
  streetNames: string[];
  showPolylines: boolean;
  zoom: number;
  points: PointData[];
}

export const MapPolylines = ({ streetNames, showPolylines, zoom, points }: MapPolylinesProps) => {
  // Function to create gradient line segments for a street (create continuous chains)
  const renderStreetLines = (streetName: string) => {
    // Extract street ID from the streetName (format: "Street X")
    const streetId = parseInt(streetName.replace('Street ', ''));
    const streetPoints = points.filter((p) => p.street_id === streetId);
    
    if (streetPoints.length < 2) return [];
    
    const connectedSegments: JSX.Element[] = [];
    const visited = new Set<number>();
    
    // Create chains of connected points
    for (const startPoint of streetPoints) {
      if (visited.has(startPoint.id)) continue;
      
      // Build a chain starting from this point
      const chain: PointData[] = [startPoint];
      visited.add(startPoint.id);
      let currentPoint = startPoint;
      
      // Keep extending the chain by finding the nearest unvisited neighbor
      while (true) {
        let nearestPoint: PointData | null = null;
        let nearestDistance = MAP_CONFIG.MAX_CONNECTION_DISTANCE;
        
        // Find the nearest unvisited point within connection distance
        for (const candidate of streetPoints) {
          if (visited.has(candidate.id)) continue;
          
          const distance = calculateDistance(currentPoint, candidate);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestPoint = candidate;
          }
        }
        
        // If we found a nearby point, add it to the chain
        if (nearestPoint && nearestDistance <= MAP_CONFIG.MAX_CONNECTION_DISTANCE) {
          chain.push(nearestPoint);
          visited.add(nearestPoint.id);
          currentPoint = nearestPoint;
        } else {
          // No more nearby points, end this chain
          break;
        }
      }
      
      // Create smooth polyline segments for this chain
      for (let i = 0; i < chain.length - 1; i++) {
        const point1 = chain[i];
        const point2 = chain[i + 1];
        
        // Draw direct line between points (no interpolation for smoother appearance)
        connectedSegments.push(
          <Polyline
            key={`${streetName}-${point1.id}-${point2.id}`}
            positions={[
              [point1.lat, point1.lon],
              [point2.lat, point2.lon],
            ]}
            color={getLuxColor((point1.lux + point2.lux) / 2)}
            weight={3}
            opacity={0.8}
            smoothFactor={1.0}
          />
        );
      }
    }
    
    return connectedSegments;
  };

  // Only respect the user's toggle - no automatic hiding based on zoom
  if (!showPolylines) {
    return null;
  }

  return (
    <>
      {streetNames.map((streetName) => (
        <React.Fragment key={streetName}>
          {renderStreetLines(streetName)}
        </React.Fragment>
      ))}
    </>
  );
};
