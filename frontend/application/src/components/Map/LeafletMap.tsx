import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState } from "react";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

import type { ReactNode } from "react";

interface LeafletMapProps {
  height?: string;
  width?: string;
  children?: ReactNode;
}

function LeafletMap({
  height = "500px",
  width = "100%",
  children,
}: LeafletMapProps) {
  const [currentTheme, setCurrentTheme] = useState("default");
  const balangaCenter: [number, number] = [14.676, 120.536];

  const themes = {
    default: {
      name: "Default",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      previewUrl: "/src/assets/maps/preview_default.png",
    },
    dark: {
      name: "Dark",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      previewUrl: "/src/assets/maps/preview_dark.png",
    },
    satellite: {
      name: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri Satellite + Dark Overlay",
      isNight: true,
      previewUrl: "/src/assets/maps/preview_satellite.png",
    },
  };

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
  };

  return (
    <>
      <style>{`
         .night-satellite-base {
           filter: hue-rotate(200deg) saturate(0.2) brightness(0.55) contrast(1.3) grayscale(0.3);
           opacity: 0.75;
         }
         
         .night-dark-overlay {
           mix-blend-mode: multiply;
           opacity: 0.4;
         }
         
         .dark-theme-overlay {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           background: rgba(255, 255, 255, 0.08);
           pointer-events: none;
           z-index: 400;
         }
         
         /* Blue overlay for dark theme - adjusted brightness/contrast/saturation */
         .dark-theme-blue-overlay {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           background: rgba(100, 150, 255, 0.2);
           mix-blend-mode: multiply;
           pointer-events: none;
           z-index: 401;
           filter: brightness(1.1) contrast(1.2) saturate(1.4);
         }
         
         /* Blue overlay for default theme */
         .default-theme-blue-overlay {
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           background: rgba(100, 150, 255, 0.1);
           mix-blend-mode: multiply;
           pointer-events: none;
           z-index: 400;
         }
         
         /* Default OSM with lighter dark theme + subtle blue tone + toned down labels */
         .default-theme-dark {
           filter: invert(1) brightness(0.8) contrast(0.85) saturate(0.3) grayscale(0.7) hue-rotate(15deg);
         }
         
         /* Dark CARTO theme with blue tone */
         .dark-theme-blue {
           filter: hue-rotate(220deg) saturate(1.3) brightness(1.0) contrast(1.1);
         }
         
         
         /* Move zoom controls to bottom-left */
         .leaflet-bottom.leaflet-left {
           bottom: 20px !important;
           left: 10px !important;
         }
         
         .leaflet-top.leaflet-left {
           display: none !important;
         }
         
         /* Make sure all leaflet controls stay within bounds */
         .leaflet-control-container {
           pointer-events: none;
         }
         
         .leaflet-control {
           pointer-events: auto;
         }
         
         /* Dark theme styling for Leaflet controls */
         .leaflet-control-zoom {
           background: rgba(17, 25, 38, 0.95) !important;
           border: 1px solid rgba(255, 255, 255, 0.2) !important;
           border-radius: 8px !important;
           box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
         }
         
         .leaflet-control-zoom a {
           background: rgba(17, 25, 38, 0.9) !important;
           color: #ffffff !important;
           border: none !important;
           font-size: 18px !important;
           font-weight: bold !important;
           transition: all 0.2s ease !important;
         }
         
         .leaflet-control-zoom a:hover {
           background: rgba(255, 255, 255, 0.1) !important;
           color: #f3f4f6 !important;
           transform: scale(1.05) !important;
         }
         
         .leaflet-control-zoom a:first-child {
           border-top-left-radius: 6px !important;
           border-top-right-radius: 6px !important;
         }
         
         .leaflet-control-zoom a:last-child {
           border-bottom-left-radius: 6px !important;
           border-bottom-right-radius: 6px !important;
         }
         
         /* Attribution styling - centered */
         .leaflet-bottom.leaflet-right {
           bottom: 10px !important;
           right: 50% !important;
           transform: translateX(50%) !important;
         }
         
         .leaflet-control-attribution {
           background: rgba(17, 25, 38, 0.7) !important;
           color: rgba(209, 213, 219, 0.6) !important;
           border: 1px solid rgba(255, 255, 255, 0.1) !important;
           border-radius: 6px !important;
           font-size: 11px !important;
           padding: 4px 8px !important;
           box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
           margin: 0 !important;
           opacity: 0.7 !important;
         }
         
         .leaflet-control-attribution a {
           color: rgba(255, 255, 255, 0.7) !important;
           text-decoration: none !important;
         }
         
         .leaflet-control-attribution a:hover {
           color: rgba(255, 255, 255, 0.9) !important;
           text-decoration: underline !important;
         }
       `}</style>

      <div style={{ 
        height, 
        width, 
        position: "relative", 
        overflow: "hidden", 
        zIndex: 1,
        marginLeft: "0",
        paddingLeft: "0",
        backgroundColor: "#070B13"
      }}>
        {/* Google Maps Style Layer Switcher */}
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "30px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            pointerEvents: "auto",
          }}
        >
          {Object.entries(themes).map(([key, theme]) => (
            <div
              key={key}
              onClick={() => handleThemeChange(key)}
              style={{
                width: "60px",
                height: "60px",
                border:
                  currentTheme === key
                    ? "3px solid #fbbf24"
                    : "2px solid rgba(255,255,255,0.8)",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow:
                  currentTheme === key
                    ? "0 4px 12px rgba(251,191,36,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.2)",
                transition: "all 0.2s ease",
                backgroundImage: `url(${theme.previewUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (currentTheme !== key) {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentTheme !== key) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
                }
              }}
            >
              {/* Layer Label */}
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  fontSize: "9px",
                  fontWeight: "600",
                  padding: "4px 2px",
                  textAlign: "center",
                  lineHeight: "1",
                }}
              >
                {theme.name}
              </div>

              {/* Active Indicator */}
              {currentTheme === key && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    background: "#fbbf24",
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <MapContainer
          center={balangaCenter}
          zoom={15}
          minZoom={14}
          maxZoom={19}
          maxBounds={[
            [14.600155704670286, 120.44799628423448],
            [14.712450787098618, 120.59856467222914],
          ]}
          maxBoundsViscosity={0.7}
          zoomControl={false}
          style={{ height: "100%", width: "100%", backgroundColor: "#070B13" }}
        >

          <TileLayer
            key={currentTheme}
            attribution={
              themes[currentTheme as keyof typeof themes].attribution
            }
            url={themes[currentTheme as keyof typeof themes].url}
            maxZoom={19}
            maxNativeZoom={18}
            className={
              currentTheme === "satellite" 
                ? "night-satellite-base" 
                : currentTheme === "default"
                ? "default-theme-dark"
                : ""
            }
          />


          {/* Night mode overlay */}
          {currentTheme === "night" && (
            <TileLayer
              attribution=""
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              maxZoom={19}
              maxNativeZoom={18}
              className="night-dark-overlay"
            />
          )}

          <ZoomControl position="bottomleft" />

          {/* Render children overlays here */}
          {children}
        </MapContainer>

        {/* Dark theme lightening overlay */}
        {currentTheme === "dark" && (
          <>
            <div className="dark-theme-overlay" />
            <div className="dark-theme-blue-overlay" />
          </>
        )}

        {/* Blue overlay for default theme */}
        {currentTheme === "default" && <div className="default-theme-blue-overlay" />}
      </div>
    </>
  );
}

export default LeafletMap;
