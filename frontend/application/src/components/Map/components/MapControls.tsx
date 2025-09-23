import React, { useState } from "react";

interface MapControlsProps {
  showMarkers: boolean;
  showPolylines: boolean;
  onToggleMarkers: () => void;
  onTogglePolylines: () => void;
}

export const MapControls = ({
  showMarkers,
  showPolylines,
  onToggleMarkers,
  onTogglePolylines,
}: MapControlsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Control Panel Button */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          backgroundColor: "rgba(30, 30, 30, 0.9)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(1.1)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "translateX(-50%) scale(1)")
        }
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 15.5A3.5 3.5 0 0 0 15.5 12 3.5 3.5 0 0 0 12 8.5a3.5 3.5 0 0 0-3.5 3.5 3.5 3.5 0 0 0 3.5 3.5zm0-5A1.5 1.5 0 0 1 13.5 12 1.5 1.5 0 0 1 12 13.5 1.5 1.5 0 0 1 10.5 12 1.5 1.5 0 0 1 12 10.5zm7.43 2.4l-.84-.83a6.4 6.4 0 0 0-.22-2.6l.89-.89a7.1 7.1 0 0 0-.63-1.05l-1.19.51a6.5 6.5 0 0 0-2.23-1.29l-.51-1.19a7.1 7.1 0 0 0-1.05-.63l-.89.89a6.4 6.4 0 0 0-2.6-.22l-.83-.84a7.1 7.1 0 0 0-1.05.63l.51 1.19a6.5 6.5 0 0 0-1.29 2.23l-1.19.51a7.1 7.1 0 0 0-.63 1.05l.89.89a6.4 6.4 0 0 0-.22 2.6l-.84.83a7.1 7.1 0 0 0 .63 1.05l1.19-.51a6.5 6.5 0 0 0 2.23 1.29l.51 1.19a7.1 7.1 0 0 0 1.05.63l.89-.89a6.4 6.4 0 0 0 2.6.22l.83.84a7.1 7.1 0 0 0 1.05-.63l-.51-1.19a6.5 6.5 0 0 0 1.29-2.23l1.19-.51a7.1 7.1 0 0 0 .63-1.05l-.89-.89a6.4 6.4 0 0 0 .22-2.6z"
            fill="white"
          />
        </svg>
      </div>

      {/* Slide-up Panel */}
      <div
        style={{
          position: "absolute",
          bottom: isExpanded ? "70px" : "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 999,
          backgroundColor: "rgba(30, 30, 30, 0.9)",
          padding: "15px 20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          transition: "bottom 0.3s ease",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          minWidth: "200px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          Show Markers
         <div
           style={{
             width: "40px",
             height: "20px",
             backgroundColor: showMarkers ? "#1976d2" : "#666",
             borderRadius: "10px",
             position: "relative",
             transition: "background-color 0.2s",
             cursor: "pointer",
           }}
           onClick={onToggleMarkers}
         >
           <div
             style={{
               width: "16px",
               height: "16px",
               backgroundColor: "white",
               borderRadius: "50%",
               position: "absolute",
               top: "2px",
               left: showMarkers ? "22px" : "2px",
               transition: "left 0.2s",
             }}
           />
         </div>
       </label>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "white",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          Show Street Lines
         <div
           style={{
             width: "40px",
             height: "20px",
             backgroundColor: showPolylines ? "#1976d2" : "#666",
             borderRadius: "10px",
             position: "relative",
             transition: "background-color 0.2s",
             cursor: "pointer",
           }}
           onClick={onTogglePolylines}
         >
           <div
             style={{
               width: "16px",
               height: "16px",
               backgroundColor: "white",
               borderRadius: "50%",
               position: "absolute",
               top: "2px",
               left: showPolylines ? "22px" : "2px",
               transition: "left 0.2s",
             }}
           />
         </div>
       </label>
      </div>
    </>
  );
};
