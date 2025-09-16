import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  height?: string;
  width?: string;
}

function LeafletMap({ height = '500px', width = '100%' }: LeafletMapProps) {
  const balangaCenter: [number, number] = [14.6760, 120.5360];
  
  return (
    <div style={{ height, width }}>
      <MapContainer
        center={balangaCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Sample marker for Balanga City Hall */}
        <Marker position={balangaCenter}>
          <Popup>
            Balanga City, Bataan
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default LeafletMap;