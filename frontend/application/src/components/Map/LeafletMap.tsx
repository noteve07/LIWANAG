import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

interface LeafletMapProps {
  height?: string;
  width?: string;
}

function LeafletMap({ height = '500px', width = '100%' }: LeafletMapProps) {
  const [currentTheme, setCurrentTheme] = useState('dark');
  const balangaCenter: [number, number] = [14.6760, 120.5360];

  const themes = {
    dark: {
      name: 'Dark',
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      previewUrl: '/src/assets/maps/preview_dark.png'
    },
    satellite: {
      name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri Satellite + Dark Overlay',
      isNight: true,
      previewUrl: '/src/assets/maps/preview_satellite.png'
    }
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
      `}</style>
      
      <div className="relative" style={{ height, width }}>
        {/* Google Maps Style Layer Switcher */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {Object.entries(themes).map(([key, theme]) => (
            <div
              key={key}
              onClick={() => handleThemeChange(key)}
              className={`
                w-15 h-15 rounded-lg cursor-pointer relative overflow-hidden
                transition-all duration-200 ease-in-out bg-cover bg-center
                hover:scale-105 hover:shadow-lg
                ${currentTheme === key 
                  ? 'border-3 border-blue-600 shadow-blue-200/30 shadow-lg' 
                  : 'border-2 border-white/80 shadow-md shadow-black/20'
                }
              `}
              style={{ backgroundImage: `url(${theme.previewUrl})` }}
            >
              {/* Layer Label */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs font-semibold px-1 py-1 text-center leading-none">
                {theme.name}
              </div>

              {/* Active Indicator */}
              {currentTheme === key && (
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
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
            [14.712450787098618, 120.59856467222914]
          ]}
          maxBoundsViscosity={0.7}
          className="h-full w-full"
        >
          <TileLayer
            key={currentTheme}
            attribution={themes[currentTheme as keyof typeof themes].attribution}
            url={themes[currentTheme as keyof typeof themes].url}
            className={currentTheme === 'satellite' ? 'night-satellite-base' : ''}
          />
          
          {/* Night mode overlay */}
          {currentTheme === 'night' && (
            <TileLayer
              attribution=""
              url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
              className="night-dark-overlay"
            />
          )}
         </MapContainer>
         
         {/* Dark theme lightening overlay */}
         {currentTheme === 'dark' && (
           <div className="absolute inset-0 bg-white/8 pointer-events-none z-[400]" />
         )}
       </div>
    </>
  );
}

export default LeafletMap;