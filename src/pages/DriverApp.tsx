import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { driverTTS } from '@/lib/driverAudioTTS';
import { DriverAudioFeedback } from '@/components/DriverAudioFeedback';
import {
  Ambulance,
  MapPin,
  Navigation,
  Phone,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Play,
  Square,
  PhoneCall,
  Map,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  ChevronRight,
  Truck,
  Activity,
  RefreshCw,
  ArrowLeft,
  Home,
} from 'lucide-react';

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
  distance: number | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  blood_group: string | null;
  emergency_contact: string | null;
}

type DriverStatus = 'available' | 'busy' | 'offline';
type TripPhase = 'assigned' | 'en_route_pickup' | 'arrived_pickup' | 'en_route_hospital' | 'arrived_hospital';

const DriverApp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('available');
  const [currentAssignment, setCurrentAssignment] = useState<Booking | null>(null);
  const [patientProfile, setPatientProfile] = useState<Profile | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<Booking[]>([]);
  const [tripPhase, setTripPhase] = useState<TripPhase>('assigned');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const prevPendingIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Unlock browser audio context on any user interaction in Driver App
  useEffect(() => {
    const handleFirstInteraction = () => {
      driverTTS.unlockAudio();
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Time update
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Location tracking and update
  useEffect(() => {
    if (!currentAssignment || driverStatus !== 'busy') return;

    let watchId: number;

    const updateLocationInDb = async (lat: number, lng: number) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Update active booking location
        if (currentAssignment) {
          await supabase
            .from('bookings')
            .update({
              current_location: { lat, lng }
            })
            .eq('id', currentAssignment.id);
        }

        // Update driver's real-time location in profiles
        await supabase
          .from('profiles')
          .update({
            current_location: { lat, lng }
          })
          .eq('user_id', user.id);

      } catch (error) {
        console.error('Error updating driver location:', error);
      }
    };

    if (typeof window !== "undefined" && navigator && "geolocation" in navigator && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLoc = { lat: latitude, lng: longitude };
          setDriverLocation(newLoc);
          updateLocationInDb(latitude, longitude);
        },
        (error) => console.warn('Driver geolocation watch note:', error?.message || `Code: ${error?.code || 'UNKNOWN'}`),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 10000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentAssignment?.id, driverStatus]);

  // Online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    checkDriverRole();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadAssignments();
      const channel = supabase
        .channel('driver-bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          () => {
            loadAssignments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthorized]);

  const checkDriverRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const hasAccess = profile?.role === 'driver' || profile?.role === 'operator' || profile?.role === 'admin';
      
      if (!hasAccess) {
        toast.error('You do not have driver access.');
        navigate('/');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Error checking role:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      // Load active assignment (if any)
      const { data: activeBooking } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (activeBooking) {
        const booking = {
          ...activeBooking,
          pickup_location: activeBooking.pickup_location as unknown as { lat: number; lng: number },
          destination_location: activeBooking.destination_location as unknown as { lat: number; lng: number },
        } as Booking;
        setCurrentAssignment(booking);
        setDriverStatus('busy');
        await loadPatientProfile(activeBooking.user_id);
      }

      // Load pending assignments
      const { data: pending } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      const pendingBookings = (pending || []).map(b => ({
        ...b,
        pickup_location: b.pickup_location as unknown as { lat: number; lng: number },
        destination_location: b.destination_location as unknown as { lat: number; lng: number },
      })) as Booking[];

      // Check for newly arrived pending assignments to trigger voice alert
      if (initialLoadDoneRef.current && pendingBookings.length > 0) {
        const newTrips = pendingBookings.filter(b => !prevPendingIdsRef.current.has(b.id));
        if (newTrips.length > 0) {
          const newest = newTrips[0];
          const locStr = newest.pickup_address ? ` Pickup at ${newest.pickup_address}.` : '';
          const distStr = newest.distance ? ` Distance ${newest.distance.toFixed(1)} kilometers.` : '';
          driverTTS.speak(`New trip assigned.${locStr}${distStr}`, {
            priority: 'high',
            toneType: 'alert',
          });
        }
      }

      prevPendingIdsRef.current = new Set(pendingBookings.map(b => b.id));
      initialLoadDoneRef.current = true;
      setPendingAssignments(pendingBookings);
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadPatientProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, blood_group, emergency_contact')
      .eq('user_id', userId)
      .maybeSingle();
    
    setPatientProfile(data);
  };

  const acceptAssignment = async (booking: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'active',
          driver_name: 'Driver', // In real app, get from driver profile
          driver_phone: '+91-9876543210',
          ambulance_number: 'DL-01-AB-1234',
          estimated_time: 10,
        })
        .eq('id', booking.id);

      if (error) throw error;

      setCurrentAssignment({ ...booking, status: 'active' });
      setDriverStatus('busy');
      setTripPhase('assigned');
      await loadPatientProfile(booking.user_id);
      toast.success('Assignment accepted!');

      // Spoken voice feedback for accepted trip
      const destName = booking.pickup_address ? ` at ${booking.pickup_address}` : '';
      driverTTS.speak(`Trip accepted. Starting navigation to pickup location${destName}.`, {
        priority: 'high',
        toneType: 'confirm',
      });
    } catch (error) {
      console.error('Error accepting assignment:', error);
      toast.error('Failed to accept assignment');
    }
  };

  const declineAssignment = async (booking: Booking) => {
    toast.info('Assignment declined');
    setPendingAssignments(prev => prev.filter(b => b.id !== booking.id));
    driverTTS.speak('Assignment declined. Standing by for next dispatch.', {
      toneType: 'alert',
    });
  };

  const updateTripPhase = async (newPhase: TripPhase) => {
    setTripPhase(newPhase);
    
    if (newPhase === 'arrived_hospital') {
      // Complete the trip
      try {
        const { error } = await supabase
          .from('bookings')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', currentAssignment?.id);

        if (error) throw error;

        toast.success('Trip completed successfully!');
        
        // Spoken confirmation for trip completion
        driverTTS.speak('Arrival confirmed at hospital. Trip completed successfully. Ready for new assignments.', {
          priority: 'high',
          toneType: 'complete',
        });

        setCurrentAssignment(null);
        setPatientProfile(null);
        setDriverStatus('available');
        setTripPhase('assigned');
      } catch (error) {
        console.error('Error completing trip:', error);
        toast.error('Failed to complete trip');
      }
    } else {
      const messages: Record<TripPhase, string> = {
        assigned: 'Assignment received',
        en_route_pickup: 'En route to pickup',
        arrived_pickup: 'Arrived at pickup location',
        en_route_hospital: 'Patient picked up, en route to hospital',
        arrived_hospital: 'Arrived at hospital',
      };
      
      const spokenMessages: Record<TripPhase, string> = {
        assigned: 'Assignment received.',
        en_route_pickup: 'Trip started. En route to pickup location.',
        arrived_pickup: 'Arrival confirmed. You have arrived at the pickup location.',
        en_route_hospital: 'Patient on board. En route to hospital destination.',
        arrived_hospital: 'Arrival confirmed at hospital. Trip completed.',
      };

      toast.success(messages[newPhase]);
      driverTTS.speak(spokenMessages[newPhase], {
        priority: 'high',
        toneType: newPhase === 'arrived_pickup' ? 'confirm' : 'confirm',
      });
    }
  };

  const openNavigation = (lat: number, lng: number) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS 
      ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    
    window.open(url, '_blank');
  };

  const callPatient = () => {
    if (patientProfile?.phone) {
      window.open(`tel:${patientProfile.phone}`);
    }
  };

  const toggleDriverStatus = async () => {
    if (currentAssignment) {
      toast.error('Cannot go offline during active trip');
      return;
    }

    const newStatus = driverStatus === 'available' ? 'offline' : 'available';
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_online: newStatus === 'available'
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setDriverStatus(newStatus);
      toast.success(`You are now ${newStatus}`);

      // Spoken voice update on online / offline status toggle
      if (newStatus === 'available') {
        driverTTS.speak('Driver online. Ready for assignments.', { toneType: 'confirm' });
      } else {
        driverTTS.speak('Driver offline. Spoken alerts paused.', { toneType: 'alert' });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Status Bar */}
      <div className="bg-black/30 px-4 py-2 flex items-center justify-between text-xs">
        <span>{currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <Signal className="w-4 h-4" />
          <Battery className="w-4 h-4" />
        </div>
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home (Landing Page)</span>
          </Link>
          <span className="text-[10px] text-white/50">Driver Portal</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Ambulance className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Driver App</h1>
              <p className="text-xs text-white/60">DL-01-AB-1234</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
            <DriverAudioFeedback />
            <Button
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white h-8 w-8 p-0"
              onClick={loadAssignments}
              title="Refresh assignments"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
              <span className="text-xs text-white/70 font-medium">
                {driverStatus === 'available' ? 'Online' : driverStatus === 'busy' ? 'Busy' : 'Offline'}
              </span>
              <Switch
                checked={driverStatus === 'available' || driverStatus === 'busy'}
                onCheckedChange={toggleDriverStatus}
                disabled={driverStatus === 'busy'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`px-4 py-3 ${
        driverStatus === 'available' ? 'bg-green-500/20' :
        driverStatus === 'busy' ? 'bg-red-500/20' : 'bg-gray-500/20'
      }`}>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            driverStatus === 'available' ? 'bg-green-500 animate-pulse' :
            driverStatus === 'busy' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
          }`} />
          <span className="text-sm font-medium">
            {driverStatus === 'available' ? 'Ready for assignments' :
             driverStatus === 'busy' ? 'On active trip' : 'You are offline'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Current Assignment */}
        {currentAssignment && (
          <Card className="bg-white/10 border-white/20 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-400 animate-pulse" />
                  Active Trip
                </CardTitle>
                <Badge className="bg-red-500">URGENT</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Info */}
              {patientProfile && (
                <div className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{patientProfile.full_name || 'Patient'}</p>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        {patientProfile.blood_group && (
                          <Badge variant="outline" className="border-red-400 text-red-400 h-5">
                            {patientProfile.blood_group}
                          </Badge>
                        )}
                        <span>{patientProfile.phone}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={callPatient}
                  >
                    <PhoneCall className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Locations */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center mt-1">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/60">PICKUP</p>
                    <p className="text-sm">{currentAssignment.pickup_address || 'Current Location'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400"
                    onClick={() => openNavigation(
                      currentAssignment.pickup_location.lat,
                      currentAssignment.pickup_location.lng
                    )}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>

                <div className="ml-4 border-l-2 border-dashed border-white/20 h-4" />

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center mt-1">
                    <MapPin className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white/60">DESTINATION</p>
                    <p className="text-sm">{currentAssignment.destination_address || 'Hospital'}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-green-400"
                    onClick={() => openNavigation(
                      currentAssignment.destination_location.lat,
                      currentAssignment.destination_location.lng
                    )}
                  >
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Trip Progress */}
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-xs text-white/60 mb-3">TRIP PROGRESS</p>
                <div className="flex items-center justify-between gap-2">
                  {[
                    { phase: 'en_route_pickup', label: 'En Route', icon: Truck },
                    { phase: 'arrived_pickup', label: 'At Pickup', icon: MapPin },
                    { phase: 'en_route_hospital', label: 'To Hospital', icon: Navigation },
                    { phase: 'arrived_hospital', label: 'Complete', icon: CheckCircle2 },
                  ].map((step, idx) => {
                    const phases: TripPhase[] = ['assigned', 'en_route_pickup', 'arrived_pickup', 'en_route_hospital', 'arrived_hospital'];
                    const currentIdx = phases.indexOf(tripPhase);
                    const stepIdx = phases.indexOf(step.phase as TripPhase);
                    const isCompleted = stepIdx < currentIdx;
                    const isCurrent = step.phase === tripPhase;
                    const Icon = step.icon;

                    return (
                      <div key={step.phase} className="flex-1 text-center">
                        <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1 transition-all ${
                          isCompleted ? 'bg-green-500' :
                          isCurrent ? 'bg-primary animate-pulse' : 'bg-white/10'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="text-xs truncate">{step.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="grid gap-2">
                {tripPhase === 'assigned' && (
                  <Button
                    className="w-full h-14 text-lg bg-gradient-to-r from-blue-500 to-blue-600"
                    onClick={() => updateTripPhase('en_route_pickup')}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Trip
                  </Button>
                )}
                {tripPhase === 'en_route_pickup' && (
                  <Button
                    className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-amber-600"
                    onClick={() => updateTripPhase('arrived_pickup')}
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Arrived at Pickup
                  </Button>
                )}
                {tripPhase === 'arrived_pickup' && (
                  <Button
                    className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-purple-600"
                    onClick={() => updateTripPhase('en_route_hospital')}
                  >
                    <User className="w-5 h-5 mr-2" />
                    Patient Picked Up
                  </Button>
                )}
                {tripPhase === 'en_route_hospital' && (
                  <Button
                    className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600"
                    onClick={() => updateTripPhase('arrived_hospital')}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Trip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Assignments */}
        {!currentAssignment && pendingAssignments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-400 animate-pulse" />
              Incoming Requests ({pendingAssignments.length})
            </h2>

            {pendingAssignments.slice(0, 3).map((booking) => (
              <Card key={booking.id} className="bg-white/10 border-yellow-500/50 text-white overflow-hidden animate-fade-in">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      NEW REQUEST
                    </Badge>
                    <span className="text-xs text-white/60">
                      {new Date(booking.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                      <p className="text-sm line-clamp-1">{booking.pickup_address || 'Current Location'}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-green-400 mt-0.5" />
                      <p className="text-sm line-clamp-1">{booking.destination_address || 'Hospital'}</p>
                    </div>
                  </div>

                  {booking.distance && (
                    <div className="flex items-center gap-4 mb-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <Map className="w-3 h-3" />
                        {booking.distance.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{booking.estimated_time || 10} min
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      onClick={() => declineAssignment(booking)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => acceptAssignment(booking)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No Assignments */}
        {!currentAssignment && pendingAssignments.length === 0 && driverStatus === 'available' && (
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Ambulance className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You're Online</h3>
              <p className="text-white/60 mb-4">Waiting for new assignments...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>GPS Active</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Offline State */}
        {driverStatus === 'offline' && (
          <Card className="bg-white/5 border-white/10 text-white">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-gray-500/20 flex items-center justify-center mb-4">
                <WifiOff className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">You're Offline</h3>
              <p className="text-white/60 mb-4">Toggle the switch above to go online and receive assignments</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-white/10 px-4 py-3">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-white">
            <Truck className="w-5 h-5" />
            <span className="text-xs">Trips</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/50">
            <Map className="w-5 h-5" />
            <span className="text-xs">Map</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/50">
            <Clock className="w-5 h-5" />
            <span className="text-xs">History</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white/50">
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverApp;
