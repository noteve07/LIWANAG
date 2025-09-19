import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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

interface LeafletMapProps {
  height?: string;
  width?: string;
}

function LeafletMap({ height = "500px", width = "100%" }: LeafletMapProps) {
  const [currentTheme, setCurrentTheme] = useState("dark");
  const balangaCenter: [number, number] = [14.676, 120.536];

  const themes = {
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
           filter: hue-rotate(200deg) saturate(0.2) brightness(0.45) contrast(1.3) grayscale(0.3);
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
       `}</style>

      <div style={{ height, width, position: "relative" }}>
        {/* Google Maps Style Layer Switcher */}
        <div
          style={{
            position: "absolute",
            top: "15px",
            right: "15px",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
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
                    ? "3px solid #1976d2"
                    : "2px solid rgba(255,255,255,0.8)",
                borderRadius: "8px",
                cursor: "pointer",
                boxShadow:
                  currentTheme === key
                    ? "0 4px 12px rgba(25,118,210,0.3)"
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
                    background: "#1976d2",
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
          maxZoom={18}
          maxBounds={[
            [14.600155704670286, 120.44799628423448],
            [14.712450787098618, 120.59856467222914],
          ]}
          maxBoundsViscosity={0.7}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            key={currentTheme}
            attribution={
              themes[currentTheme as keyof typeof themes].attribution
            }
            url={themes[currentTheme as keyof typeof themes].url}
            className={
              currentTheme === "satellite" ? "night-satellite-base" : ""
            }
          />

          {/* Night mode overlay */}
          {currentTheme === "night" && (
            <TileLayer
              attribution=""
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              className="night-dark-overlay"
            />
          )}

          <Marker position={balangaCenter}>
            <Popup>Balanga City, Bataan</Popup>
          </Marker>
        </MapContainer>

        {/* Dark theme lightening overlay */}
        {currentTheme === "dark" && <div className="dark-theme-overlay" />}
      </div>
    </>
  );
}

export default LeafletMap;
