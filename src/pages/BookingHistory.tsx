import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Clock, MapPin, Navigation, Phone, User, Calendar, ArrowLeft, Home } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  pickup_address: string;
  destination_address: string;
  status: string;
  ambulance_number: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  estimated_time: number | null;
  distance: number | null;
  created_at: string;
  completed_at: string | null;
}

const BookingHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    checkUserAndLoadBookings();
  }, []);

  const checkUserAndLoadBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    loadBookings(user.id);
  };

  const loadBookings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to load booking history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "active":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Booking History</h1>
            <p className="text-muted-foreground">View all your past and current ambulance bookings</p>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No bookings found. Press SOS to request an ambulance.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          {format(new Date(booking.created_at), "PPP")}
                        </CardTitle>
                        <CardDescription>
                          {format(new Date(booking.created_at), "p")}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">Pickup Location</p>
                            <p className="text-muted-foreground text-sm">{booking.pickup_address || "Location not provided"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className="w-5 h-5 text-destructive mt-0.5" />
                          <div>
                            <p className="font-semibold text-sm">Destination</p>
                            <p className="text-muted-foreground text-sm">{booking.destination_address || "Destination not provided"}</p>
                          </div>
                        </div>
                      </div>

                      {booking.driver_name && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-semibold text-sm">Driver</p>
                              <p className="text-muted-foreground text-sm">{booking.driver_name}</p>
                            </div>
                          </div>
                          {booking.ambulance_number && (
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">Vehicle:</p>
                              <p className="text-muted-foreground text-sm">{booking.ambulance_number}</p>
                            </div>
                          )}
                          {booking.driver_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-5 h-5 text-muted-foreground" />
                              <p className="text-muted-foreground text-sm">{booking.driver_phone}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm">
                      {booking.estimated_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>ETA: {booking.estimated_time} min</span>
                        </div>
                      )}
                      {booking.distance && (
                        <div className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          <span>Distance: {booking.distance} km</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookingHistory;
