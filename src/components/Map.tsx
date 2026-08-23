import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const userIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxMiIgZmlsbD0iIzIxOTZGMyIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PC9zdmc+',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const ambulanceIcon = L.icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxMiIgZmlsbD0iI0VGNDQ0NCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIi8+PHJlY3QgeD0iMTMiIHk9IjkiIHdpZHRoPSI0IiBoZWlnaHQ9IjEyIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjkiIHk9IjEzIiB3aWR0aD0iMTIiIGhlaWdodD0iNCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface MapProps {
  userLocation?: { lat: number; lng: number };
  ambulanceLocation?: { lat: number; lng: number };
}

const MapUpdater = ({ userLocation, ambulanceLocation }: MapProps) => {
  const map = useMap();

  useEffect(() => {
    if (userLocation && ambulanceLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [ambulanceLocation.lat, ambulanceLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [map, userLocation, ambulanceLocation]);

  return null;
};

const Map = ({ userLocation, ambulanceLocation }: MapProps) => {
  // Default locations (Delhi, India)
  const defaultUserLoc = userLocation || { lat: 28.6139, lng: 77.2090 };
  const defaultAmbulanceLoc = ambulanceLocation || { lat: 28.5950, lng: 77.1850 };

  return (
    <div className="relative h-64 rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={[defaultUserLoc.lat, defaultUserLoc.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <Marker position={[defaultUserLoc.lat, defaultUserLoc.lng]} icon={userIcon}>
          <Popup>Your Location</Popup>
        </Marker>

        {ambulanceLocation && (
          <Marker position={[defaultAmbulanceLoc.lat, defaultAmbulanceLoc.lng]} icon={ambulanceIcon}>
            <Popup>Ambulance Location</Popup>
          </Marker>
        )}

        <MapUpdater userLocation={userLocation} ambulanceLocation={ambulanceLocation} />
      </MapContainer>
    </div>
  );
};

export default Map;
