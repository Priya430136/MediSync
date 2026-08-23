import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, User, Truck, Clock, Navigation, Activity } from 'lucide-react';

interface Booking {
  id: string;
  user_id: string;
  pickup_address: string | null;
  destination_address: string | null;
  pickup_location: { lat: number; lng: number };
  destination_location: { lat: number; lng: number };
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  driver_name: string | null;
  driver_phone: string | null;
  ambulance_number: string | null;
  estimated_time: number | null;
}

interface AmbulancePosition {
  bookingId: string;
  lat: number;
  lng: number;
  progress: number;
  speed: number;
  heading: number;
}

interface FleetMapProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
  onAssign: (booking: Booking) => void;
}

// Create ambulance icon with rotation
const createAmbulanceIcon = (heading: number) => L.divIcon({
  className: 'custom-marker ambulance-moving',
  html: `<div style="
    background: linear-gradient(135deg, #ef4444, #dc2626);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(${heading}deg);
    transition: transform 0.5s ease-out;
  ">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="transform: rotate(-${heading}deg);">
      <path d="M19 8h-1.5l-.5-1.5V3.5a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 7 3.5V6.5L6.5 8H5a3 3 0 0 0-3 3v5h2a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h2v-5a3 3 0 0 0-3-3zM7 16a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
      <rect x="10" y="4" width="4" height="6" rx="0.5" fill="white"/>
      <rect x="9" y="6" width="6" height="2" rx="0.5" fill="white"/>
    </svg>
  </div>
  <div style="
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    background: #22c55e;
    color: white;
    font-size: 10px;
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 10px;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  ">LIVE</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// Custom icons
const pendingIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: linear-gradient(135deg, #f59e0b, #d97706);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse 2s infinite;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  </style>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const pickupIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const destinationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    background: linear-gradient(135deg, #22c55e, #16a34a);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
      <path d="M18 11V6l-5 5-1.41-1.41L17 4h-5V2h8v8h-2zM4 8h2v12h12v2H4V8z"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const MapController = ({ bookings }: { bookings: Booking[] }) => {
  const map = useMap();

  useEffect(() => {
    const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'active');
    
    if (activeBookings.length > 0) {
      const bounds = L.latLngBounds(
        activeBookings.flatMap(b => [
          [b.pickup_location.lat, b.pickup_location.lng],
          [b.destination_location.lat, b.destination_location.lng],
        ])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [bookings, map]);

  return null;
};

// Calculate heading angle between two points
const calculateHeading = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const heading = Math.atan2(y, x) * 180 / Math.PI;
  return (heading + 360) % 360;
};

// Interpolate position along a path
const interpolatePosition = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  progress: number
) => {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
};

const FleetMap = ({ bookings, onViewDetails, onAssign }: FleetMapProps) => {
  const [ambulancePositions, setAmbulancePositions] = useState<Map<string, AmbulancePosition>>(new Map());
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(Date.now());

  const activeBookings = useMemo(() => 
    bookings.filter(b => b.status === 'pending' || b.status === 'active'),
    [bookings]
  );

  const activeAmbulances = useMemo(() => 
    bookings.filter(b => b.status === 'active'),
    [bookings]
  );

  // Initialize and animate ambulance positions
  useEffect(() => {
    // Initialize positions for new active bookings
    setAmbulancePositions(prev => {
      const newPositions = new Map(prev);
      
      activeAmbulances.forEach(booking => {
        if (!newPositions.has(booking.id)) {
          const heading = calculateHeading(booking.pickup_location, booking.destination_location);
          newPositions.set(booking.id, {
            bookingId: booking.id,
            lat: booking.pickup_location.lat,
            lng: booking.pickup_location.lng,
            progress: 0,
            speed: 0.0005 + Math.random() * 0.0003, // Variable speed
            heading,
          });
        }
      });

      // Remove completed bookings
      const activeIds = new Set(activeAmbulances.map(b => b.id));
      newPositions.forEach((_, key) => {
        if (!activeIds.has(key)) {
          newPositions.delete(key);
        }
      });

      return newPositions;
    });
  }, [activeAmbulances]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setAmbulancePositions(prev => {
        const newPositions = new Map(prev);
        
        activeAmbulances.forEach(booking => {
          const pos = newPositions.get(booking.id);
          if (pos && pos.progress < 1) {
            // Update progress (simulate ~5 min journey)
            const newProgress = Math.min(pos.progress + delta * pos.speed, 1);
            const newPos = interpolatePosition(
              booking.pickup_location,
              booking.destination_location,
              newProgress
            );
            
            // Calculate new heading
            const heading = calculateHeading(
              { lat: pos.lat, lng: pos.lng },
              newPos
            );

            newPositions.set(booking.id, {
              ...pos,
              lat: newPos.lat,
              lng: newPos.lng,
              progress: newProgress,
              heading: isNaN(heading) ? pos.heading : heading,
            });
          }
        });

        return newPositions;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activeAmbulances]);

  const center = useMemo(() => {
    if (activeBookings.length > 0) {
      const lats = activeBookings.map(b => b.pickup_location.lat);
      const lngs = activeBookings.map(b => b.pickup_location.lng);
      return {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
      };
    }
    return { lat: 28.6139, lng: 77.2090 };
  }, [activeBookings]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'active': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstimatedArrival = (pos: AmbulancePosition | undefined, estimatedTime: number | null) => {
    if (!pos) return estimatedTime || 0;
    const remaining = Math.max(0, (1 - pos.progress) * (estimatedTime || 10));
    return Math.ceil(remaining);
  };

  return (
    <div className="relative h-[600px] rounded-xl overflow-hidden border shadow-lg">
      {/* Legend */}
      <div className="absolute top-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          Live Tracking
        </h4>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white shadow" />
            <span>Pending ({activeBookings.filter(b => b.status === 'pending').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-white shadow animate-pulse" />
            <span>En Route ({activeAmbulances.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow" />
            <span>Pickup Point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white shadow" />
            <span>Destination</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
        <div className="text-center mb-2">
          <p className="text-2xl font-bold text-primary">{activeBookings.length}</p>
          <p className="text-xs text-muted-foreground">Active Operations</p>
        </div>
        {activeAmbulances.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-green-600 justify-center">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>GPS Active</span>
          </div>
        )}
      </div>

      {/* Active ambulances list */}
      {activeAmbulances.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border max-w-xs">
          <h4 className="text-xs font-semibold mb-2 text-muted-foreground">AMBULANCES EN ROUTE</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {activeAmbulances.map(booking => {
              const pos = ambulancePositions.get(booking.id);
              const eta = getEstimatedArrival(pos, booking.estimated_time);
              const progress = pos ? Math.round(pos.progress * 100) : 0;
              
              return (
                <div key={booking.id} className="flex items-center gap-2 text-xs">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    <Truck className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{booking.ambulance_number || 'Ambulance'}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-green-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{eta}m</p>
                    <p className="text-muted-foreground">ETA</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController bookings={bookings} />

        {activeBookings.map((booking) => {
          const isActive = booking.status === 'active';
          const pos = ambulancePositions.get(booking.id);
          const currentLat = isActive && pos ? pos.lat : booking.pickup_location.lat;
          const currentLng = isActive && pos ? pos.lng : booking.pickup_location.lng;
          const heading = pos?.heading || 0;

          return (
            <div key={booking.id}>
              {/* Route line for active ambulances */}
              {isActive && (
                <>
                  {/* Completed portion of route */}
                  <Polyline
                    positions={[
                      [booking.pickup_location.lat, booking.pickup_location.lng],
                      [currentLat, currentLng],
                    ]}
                    color="#22c55e"
                    weight={4}
                    opacity={0.8}
                  />
                  {/* Remaining portion of route */}
                  <Polyline
                    positions={[
                      [currentLat, currentLng],
                      [booking.destination_location.lat, booking.destination_location.lng],
                    ]}
                    color="#ef4444"
                    weight={4}
                    opacity={0.6}
                    dashArray="10, 10"
                  />
                  {/* Pickup marker */}
                  <Marker 
                    position={[booking.pickup_location.lat, booking.pickup_location.lng]}
                    icon={pickupIcon}
                  >
                    <Popup>
                      <div className="p-1">
                        <p className="text-xs text-muted-foreground">Pickup Point</p>
                        <p className="text-sm font-medium">
                          {booking.pickup_address || 'Patient Location'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {/* Ambulance/Request marker */}
              <Marker 
                position={[currentLat, currentLng]}
                icon={isActive ? createAmbulanceIcon(heading) : pendingIcon}
              >
                <Popup minWidth={280} maxWidth={320}>
                  <div className="p-1">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={`${getStatusColor(booking.status)} text-white`}>
                        {booking.status === 'pending' ? 'Awaiting Dispatch' : 'En Route'}
                      </Badge>
                      {isActive && pos && (
                        <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          {Math.round(pos.progress * 100)}% complete
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Pickup</p>
                          <p className="text-sm font-medium line-clamp-2">
                            {booking.pickup_address || 'Current Location'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Destination</p>
                          <p className="text-sm font-medium line-clamp-2">
                            {booking.destination_address || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {booking.driver_name && (
                      <div className="bg-muted/50 rounded-lg p-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{booking.driver_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Truck className="w-3 h-3" />
                          <span>{booking.ambulance_number}</span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span className="text-primary font-medium">
                            {getEstimatedArrival(pos, booking.estimated_time)} min ETA
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => onViewDetails(booking)}
                      >
                        View Details
                      </Button>
                      {booking.status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => onAssign(booking)}
                        >
                          Assign Driver
                        </Button>
                      )}
                      {booking.driver_phone && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => window.open(`tel:${booking.driver_phone}`)}
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Destination marker */}
              <Marker 
                position={[booking.destination_location.lat, booking.destination_location.lng]}
                icon={destinationIcon}
              >
                <Popup>
                  <div className="p-1">
                    <p className="text-xs text-muted-foreground">Destination</p>
                    <p className="text-sm font-medium">
                      {booking.destination_address || 'Hospital'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>

      {activeBookings.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1000]">
          <div className="text-center">
            <Truck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Active Operations</h3>
            <p className="text-muted-foreground text-sm">
              All ambulances are currently available
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetMap;
