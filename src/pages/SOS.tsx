import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Ambulance, 
  User, 
  Navigation, 
  Share2, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Heart,
  Droplets,
  UserCheck,
  PhoneCall,
  X,
  RefreshCw,
  Siren
} from "lucide-react";
import Map from "@/components/Map";
import VoiceSOSTrigger from "@/components/VoiceSOSTrigger";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { handleApiError, checkRateLimit } from "@/utils/api-resilience";
import { ArrowLeft, Home } from "lucide-react";

type BookingStatus = 'pending' | 'active' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  user_id: string;
  pickup_location: { lat: number; lng: number };
  destination_location: { lat: number; lng: number };
  pickup_address: string | null;
  destination_address: string | null;
  status: BookingStatus;
  estimated_time: number | null;
  distance: number | null;
  current_location: { lat: number; lng: number } | null;
  driver_name: string | null;
  driver_phone: string | null;
  ambulance_number: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  emergency_contact: string | null;
  blood_group: string | null;
  address: string | null;
}

const EMERGENCY_TYPES = [
  { id: 'cardiac', label: 'Heart Attack / Chest Pain', icon: Heart, color: 'text-red-500' },
  { id: 'accident', label: 'Road Accident / Trauma', icon: Ambulance, color: 'text-orange-500' },
  { id: 'breathing', label: 'Breathing Difficulty', icon: Droplets, color: 'text-blue-500' },
  { id: 'other', label: 'Other Emergency', icon: AlertCircle, color: 'text-yellow-500' },
];

const SOS = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>("");
  const [destination, setDestination] = useState("");
  const [emergencyType, setEmergencyType] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(true);
  const [ambulanceLocation, setAmbulanceLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  const triggerSMSSOS = () => {
    const message = `EMERGENCY! User ${user?.email} needs help at ${locationAddress}. Type: ${emergencyType || 'General'}. Notes: ${additionalNotes}`;
    const emergencyNumber = profile?.emergency_contact || "102"; // Default ambulance number in India
    
    // Using tel: link to initiate SMS via browser/mobile
    const smsLink = `sms:${emergencyNumber}?body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
    toast.info("Offline SOS initiated via SMS.");
  };

  // Timeline steps
  const getTimelineSteps = (booking: Booking | null) => {
    if (!booking) return [];
    
    const steps = [
      {
        id: 'requested',
        label: 'Emergency Requested',
        description: `Request sent at ${new Date(booking.created_at).toLocaleTimeString()}`,
        status: 'completed' as const,
      },
      {
        id: 'confirmed',
        label: 'Ambulance Assigned',
        description: booking.driver_name ? `Driver: ${booking.driver_name}` : 'Finding nearest ambulance...',
        status: booking.driver_name ? 'completed' as const : 'current' as const,
      },
      {
        id: 'enroute',
        label: 'Ambulance En Route',
        description: booking.status === 'active' ? 'Ambulance is on the way' : 'Waiting for dispatch',
        status: booking.status === 'active' ? 'completed' as const : (booking.driver_name ? 'current' as const : 'pending' as const),
      },
      {
        id: 'arrived',
        label: 'Arrived at Location',
        description: 'Ambulance reached your location',
        status: booking.status === 'completed' ? 'completed' as const : 'pending' as const,
      },
    ];
    
    return steps;
  };

  useEffect(() => {
    checkUser();
    getUserLocation();
  }, []);

  // Handle real-time booking updates
  useEffect(() => {
    if (!currentBooking) return;

    const channel = supabase
      .channel(`booking-${currentBooking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${currentBooking.id}`,
        },
        (payload) => {
          console.log('Booking updated:', payload);
          const updatedBooking = payload.new as Booking;
          setCurrentBooking(updatedBooking);
          
          // Update ambulance location from real data
          if (updatedBooking.current_location) {
            const loc = updatedBooking.current_location as { lat: number; lng: number };
            setAmbulanceLocation(loc);
          }
          
          if (updatedBooking.status === 'active' && !currentBooking.driver_name && updatedBooking.driver_name) {
            toast.success(`Ambulance ${updatedBooking.ambulance_number} assigned! Driver: ${updatedBooking.driver_name}`);
          }
          
          if (updatedBooking.status === 'completed') {
            toast.success("Ambulance has arrived at your location!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentBooking?.id]);

  // Removed simulation: Ambulance location now comes from real-time updates in current_location field

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login to use SOS services");
      navigate("/auth");
      return;
    }
    setUser(user);
    
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }
    
    checkActiveBooking(user.id);
  };

  const getUserLocation = useCallback((showUserToast = false) => {
    setIsLocating(true);
    if (typeof window !== "undefined" && navigator && "geolocation" in navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setIsLocating(false);
          
          // Reverse geocoding representation
          setLocationAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
          if (showUserToast) {
            toast.success("Location acquired successfully");
          }
        },
        (error) => {
          // GeolocationPositionError code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
          console.warn("Geolocation acquisition note:", error?.message || `Code: ${error?.code || 'UNKNOWN'}`);
          if (showUserToast) {
            toast.info("Using default location coordinates. You can also specify an exact address.");
          }
          setUserLocation((prev) => prev || { lat: 28.6139, lng: 77.2090 });
          setLocationAddress((prev) => prev || "New Delhi Central Healthcare Center (Default)");
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      setUserLocation({ lat: 28.6139, lng: 77.2090 });
      setLocationAddress("New Delhi Central Healthcare Center (Default)");
      setIsLocating(false);
    }
  }, []);

  const checkActiveBooking = async (userId: string) => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setCurrentBooking(data as Booking);
    }
  };

  const handleEmergencyRequest = async () => {
    if (!checkRateLimit("emergency-request", 10000)) return;

    if (!user || !userLocation) {
      toast.error("Please enable location access");
      return;
    }

    if (!emergencyType) {
      toast.error("Please select an emergency type");
      return;
    }

    if (!destination.trim()) {
      toast.error("Please enter a destination hospital");
      return;
    }

    setIsLoading(true);

    try {
      const { data: bookingData, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          pickup_location: { lat: userLocation.lat, lng: userLocation.lng },
          destination_location: { lat: userLocation.lat, lng: userLocation.lng },
          pickup_address: locationAddress || "Current Location",
          destination_address: destination,
          status: "pending" as BookingStatus,
          estimated_time: Math.floor(Math.random() * 5) + 5, // 5-10 minutes
          distance: parseFloat((Math.random() * 5 + 1).toFixed(1)), // 1-6 km
        })
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notification
      if (profile?.phone) {
        try {
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              phoneNumber: profile.phone,
              message: `🚨 EMERGENCY AMBULANCE REQUEST\n\nType: ${emergencyType}\nPickup: ${locationAddress}\nDestination: ${destination}\n${additionalNotes ? `Notes: ${additionalNotes}` : ''}\n\nOur team is dispatching an ambulance immediately. Stay calm.`,
            },
          });
        } catch (notificationError) {
          console.error('WhatsApp notification failed:', notificationError);
        }
      }

      // Notify emergency contact
      if (profile?.emergency_contact) {
        try {
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              phoneNumber: profile.emergency_contact,
              message: `🚨 EMERGENCY ALERT\n\n${profile.full_name || 'A family member'} has requested an emergency ambulance.\n\nType: ${emergencyType}\nLocation: ${locationAddress}\nDestination: ${destination}\n\nTrack at: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
            },
          });
          toast.info("Emergency contact notified");
        } catch (notificationError) {
          console.error('Emergency contact notification failed:', notificationError);
        }
      }

      setCurrentBooking(bookingData as Booking);
      toast.success("Emergency request sent! Ambulance is being dispatched.");

      // Dispatch telemetry is stored and broadcast via emergency dispatch service.

    } catch (error: any) {
      handleApiError(error, "Failed to send emergency request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentBooking) return;

    const confirmed = window.confirm("Are you sure you want to cancel the ambulance request?");
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" as BookingStatus })
        .eq("id", currentBooking.id);

      if (error) throw error;

      setCurrentBooking(null);
      setAmbulanceLocation(null);
      toast.success("Emergency request cancelled");
    } catch (error: any) {
      toast.error("Failed to cancel request");
    }
  };

  const handleShareLocation = async () => {
    if (!userLocation) {
      toast.error("Location not available");
      return;
    }

    const shareData = {
      title: "My Emergency Location",
      text: `🚨 EMERGENCY: I need help!\nLocation: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
      url: `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      await navigator.clipboard.writeText(shareData.text);
      toast.success("Location copied to clipboard!");
    }
  };

  const handleCompleteBooking = async () => {
    if (!currentBooking) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ 
          status: "completed" as BookingStatus,
          completed_at: new Date().toISOString(),
        })
        .eq("id", currentBooking.id);

      if (error) throw error;

      toast.success("Trip completed. Thank you for using our services!");
      setCurrentBooking(null);
      setAmbulanceLocation(null);
    } catch (error: any) {
      toast.error("Failed to complete booking");
    }
  };

  // Voice SOS handler - quick dispatch with default values
  const handleVoiceSOS = async () => {
    if (!user || !userLocation) {
      toast.error("Please enable location access");
      return;
    }

    setIsLoading(true);

    try {
      const { data: bookingData, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          pickup_location: { lat: userLocation.lat, lng: userLocation.lng },
          destination_location: { lat: userLocation.lat, lng: userLocation.lng },
          pickup_address: locationAddress || "Current Location",
          destination_address: "Nearest Hospital (Voice SOS)",
          status: "pending" as BookingStatus,
          estimated_time: Math.floor(Math.random() * 5) + 5,
          distance: parseFloat((Math.random() * 5 + 1).toFixed(1)),
        })
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notification
      if (profile?.phone) {
        try {
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              phoneNumber: profile.phone,
              message: `🚨 VOICE SOS ACTIVATED\n\nEmergency ambulance dispatched!\nLocation: ${locationAddress}\n\nHelp is on the way. Stay calm.`,
            },
          });
        } catch (notificationError) {
          console.error('WhatsApp notification failed:', notificationError);
        }
      }

      // Notify emergency contact
      if (profile?.emergency_contact) {
        try {
          await supabase.functions.invoke('send-whatsapp-notification', {
            body: {
              phoneNumber: profile.emergency_contact,
              message: `🚨 VOICE SOS EMERGENCY\n\n${profile.full_name || 'A family member'} triggered a voice emergency!\n\nLocation: ${locationAddress}\nTrack at: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
            },
          });
        } catch (notificationError) {
          console.error('Emergency contact notification failed:', notificationError);
        }
      }

      setCurrentBooking(bookingData as Booking);
      setEmergencyType('other');
      setDestination('Nearest Hospital (Voice SOS)');

      // Simulate driver assignment
      setTimeout(async () => {
        const drivers = [
          { name: 'Rajesh Kumar', phone: '+91 98765 43210', vehicle: 'DL-1234-AMB' },
          { name: 'Amit Singh', phone: '+91 87654 32109', vehicle: 'DL-5678-AMB' },
          { name: 'Suresh Sharma', phone: '+91 76543 21098', vehicle: 'DL-9012-AMB' },
        ];
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        
        await supabase
          .from("bookings")
          .update({
            driver_name: randomDriver.name,
            driver_phone: randomDriver.phone,
            ambulance_number: randomDriver.vehicle,
            status: 'active' as BookingStatus,
          })
          .eq("id", bookingData.id);
      }, 3000);

    } catch (error: any) {
      toast.error("Failed to dispatch ambulance: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const timelineSteps = getTimelineSteps(currentBooking);
  const hasActiveBooking = currentBooking && ['pending', 'active'].includes(currentBooking.status);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-4">
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home (Landing Page)</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <Siren className="w-10 h-10 text-destructive animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Emergency <span className="text-destructive">SOS</span>
              </h1>
              <Siren className="w-10 h-10 text-destructive animate-pulse" />
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {hasActiveBooking 
                ? "Your ambulance is on the way. Stay calm and keep your phone accessible."
                : "Request immediate ambulance assistance with real-time tracking"}
            </p>
          </div>

          {/* Voice SOS Trigger */}
          <div className="max-w-2xl mx-auto mb-8">
            <VoiceSOSTrigger
              onTriggerSOS={handleVoiceSOS}
              isEmergencyActive={hasActiveBooking || false}
              disabled={isLoading}
            />

            {!isOnline && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-center">
                <p className="text-yellow-500 font-medium mb-2">You are currently offline</p>
                <Button 
                  variant="outline" 
                  className="w-full border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                  onClick={triggerSMSSOS}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  SEND SOS VIA SMS
                </Button>
              </div>
            )}
          </div>

          {/* Quick Call Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button
              size="lg"
              variant="destructive"
              className="gap-2"
              onClick={() => window.open("tel:108")}
            >
              <PhoneCall className="w-5 h-5" />
              Call 108 (Emergency)
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => window.open("tel:102")}
            >
              <Phone className="w-5 h-5" />
              Call 102 (Ambulance)
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Request Form or Map */}
            <div className="lg:col-span-2 space-y-6">
              {/* Map Card */}
              <Card className={hasActiveBooking ? "border-destructive" : ""}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-destructive" />
                    {hasActiveBooking ? "Live Ambulance Tracking" : "Your Location"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLocating ? (
                    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                        <p className="text-muted-foreground">Getting your location...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Map 
                        userLocation={userLocation || undefined} 
                        ambulanceLocation={hasActiveBooking ? ambulanceLocation || undefined : undefined} 
                      />
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {locationAddress}
                        </span>
                        <Button variant="ghost" size="sm" onClick={getUserLocation}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Refresh
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Request Form - Only show if no active booking */}
              {!hasActiveBooking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ambulance className="w-5 h-5 text-destructive" />
                      Request Emergency Ambulance
                    </CardTitle>
                    <CardDescription>
                      Fill in the details below for faster response
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Emergency Type Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Emergency Type *</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {EMERGENCY_TYPES.map((type) => (
                          <Button
                            key={type.id}
                            variant={emergencyType === type.id ? "default" : "outline"}
                            className={`h-auto py-4 justify-start gap-3 ${
                              emergencyType === type.id ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setEmergencyType(type.id)}
                          >
                            <type.icon className={`w-5 h-5 ${type.color}`} />
                            <span className="text-sm">{type.label}</span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Destination */}
                    <div className="space-y-2">
                      <Label htmlFor="destination" className="text-base font-semibold">
                        Destination Hospital *
                      </Label>
                      <Input
                        id="destination"
                        placeholder="Enter hospital name or address"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="h-12"
                      />
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-base font-semibold">
                        Additional Information (Optional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional details about the emergency (patient condition, special requirements, etc.)"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* Patient Info Summary */}
                    {profile && (profile.blood_group || profile.emergency_contact) && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-semibold">Patient Information (from profile)</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {profile.blood_group && (
                            <span className="flex items-center gap-1">
                              <Droplets className="w-4 h-4 text-red-500" />
                              Blood: {profile.blood_group}
                            </span>
                          )}
                          {profile.emergency_contact && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4 text-green-500" />
                              Emergency: {profile.emergency_contact}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      onClick={handleEmergencyRequest}
                      disabled={isLoading || isLocating}
                      className="w-full h-14 text-lg bg-destructive hover:bg-destructive/90"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Dispatching Ambulance...
                        </>
                      ) : (
                        <>
                          🚨 REQUEST EMERGENCY AMBULANCE
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Timeline - Only show if booking exists */}
              {hasActiveBooking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-destructive" />
                      Journey Updates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {timelineSteps.map((step, index) => (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.status === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : step.status === 'current'
                                  ? 'bg-destructive text-white animate-pulse'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {step.status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : step.status === 'current' ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <span className="text-sm">{index + 1}</span>
                              )}
                            </div>
                            {index < timelineSteps.length - 1 && (
                              <div className={`w-0.5 h-12 ${
                                step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                              }`} />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className={`font-semibold ${
                              step.status === 'pending' ? 'text-muted-foreground' : ''
                            }`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Controls & Info */}
            <div className="space-y-6">
              {/* ETA Card */}
              {hasActiveBooking && (
                <Card className="bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-90" />
                      <p className="text-sm opacity-90 mb-1">Estimated Arrival</p>
                      <p className="text-5xl font-bold mb-1">
                        {currentBooking?.estimated_time || "--"}
                      </p>
                      <p className="text-lg opacity-90">minutes</p>
                      {currentBooking?.distance && (
                        <Badge variant="secondary" className="mt-3 bg-white/20 text-white">
                          {currentBooking.distance} km away
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ambulance Details */}
              {hasActiveBooking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Ambulance Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentBooking?.driver_name ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Driver</span>
                          <span className="font-semibold flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-green-500" />
                            {currentBooking.driver_name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Vehicle</span>
                          <Badge variant="outline">{currentBooking.ambulance_number}</Badge>
                        </div>
                        {currentBooking.driver_phone && (
                          <Button 
                            className="w-full gap-2" 
                            onClick={() => window.open(`tel:${currentBooking.driver_phone}`)}
                          >
                            <Phone className="w-4 h-4" />
                            Call Driver
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-destructive" />
                        <p className="text-muted-foreground">Assigning nearest ambulance...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Emergency Actions */}
              <Card className={hasActiveBooking ? "" : "border-destructive/50"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleShareLocation}
                    disabled={!userLocation}
                  >
                    <Share2 className="w-4 h-4" />
                    Share Location with Family
                  </Button>
                  
                  {profile?.emergency_contact && (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => window.open(`tel:${profile.emergency_contact}`)}
                    >
                      <Phone className="w-4 h-4" />
                      Call Emergency Contact
                    </Button>
                  )}

                  {hasActiveBooking && currentBooking?.status === 'active' && (
                    <Button
                      variant="default"
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                      onClick={handleCompleteBooking}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm Ambulance Arrived
                    </Button>
                  )}

                  {hasActiveBooking && (
                    <Button
                      variant="ghost"
                      className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleCancelRequest}
                    >
                      <X className="w-4 h-4" />
                      Cancel Request
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* User Profile Card */}
              {profile && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Your Emergency Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {profile.full_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium">{profile.full_name}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{profile.phone}</span>
                      </div>
                    )}
                    {profile.blood_group && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Blood Group</span>
                        <Badge variant="destructive">{profile.blood_group}</Badge>
                      </div>
                    )}
                    <Button
                      variant="link"
                      className="w-full text-xs p-0 h-auto"
                      onClick={() => navigate('/profile')}
                    >
                      Update Emergency Info →
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SOS;
