import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import AssignDriverModal from '@/components/AssignDriverModal';
import BookingDetailsPanel from '@/components/BookingDetailsPanel';
import FleetMap from '@/components/FleetMap';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Ambulance,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Siren,
  Truck,
  User,
  XCircle,
  Bell,
  TrendingUp,
  Activity,
  Map,
  List,
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
  updated_at: string;
  completed_at: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  ambulance_number: string | null;
  estimated_time: number | null;
  distance: number | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  emergency_contact: string | null;
  blood_group: string | null;
}

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingProfile, setSelectedBookingProfile] = useState<Profile | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [newRequestsCount, setNewRequestsCount] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isAutoDispatching, setIsAutoDispatching] = useState(false);

  // Helper function to calculate distance between two coordinates in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Real-time auto-dispatch logic
  const autoDispatch = async (booking: Booking) => {
    setIsAutoDispatching(true);
    toast.info("Finding nearest available ambulance...");

    try {
      // 1. Fetch all online drivers
      const { data: onlineDrivers, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, current_location, ambulance_number')
        .eq('is_online', true);

      if (fetchError) throw fetchError;

      if (!onlineDrivers || onlineDrivers.length === 0) {
        toast.error("No online ambulances available right now.");
        return;
      }

      // 2. Find the nearest driver
      let nearestDriver = null;
      let minDistance = Infinity;

      for (const driver of onlineDrivers) {
        if (driver.current_location) {
          const loc = driver.current_location as unknown as { lat: number; lng: number };
          const dist = calculateDistance(
            booking.pickup_location.lat, 
            booking.pickup_location.lng,
            loc.lat,
            loc.lng
          );

          if (dist < minDistance) {
            minDistance = dist;
            nearestDriver = driver;
          }
        }
      }

      if (!nearestDriver || minDistance > 50) { // Limit to 50km
        toast.error("No nearby ambulances found.");
        return;
      }

      // 3. Update booking with driver info
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'active',
          driver_name: nearestDriver.full_name || 'Assigned Driver',
          driver_phone: nearestDriver.phone || '+91-XXXXXXXXXX',
          ambulance_number: nearestDriver.ambulance_number || 'AMB-NEW',
          estimated_time: Math.round(minDistance * 3), // Rough estimate: 3 mins per km
          current_location: nearestDriver.current_location
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      toast.success(`Ambulance ${nearestDriver.ambulance_number} dispatched!`);
      loadBookings();
    } catch (error) {
      console.error("Auto-dispatch error:", error);
      toast.error("Auto-dispatch failed. Please assign manually.");
    } finally {
      setIsAutoDispatching(false);
    }
  };

  useEffect(() => {
    checkOperatorRole();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadBookings();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [isAuthorized]);

  // Play notification sound for new requests
  useEffect(() => {
    if (newRequestsCount > 0) {
      // Use Web Audio API for notification sound
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
        console.log('Audio notification not available');
      }
    }
  }, [newRequestsCount]);

  const checkOperatorRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking role:', error);
        toast.error('Unable to verify your permissions.');
        navigate('/');
        return;
      }

      const hasOperatorAccess = profile?.role === 'operator' || profile?.role === 'admin';

      if (!hasOperatorAccess) {
        toast.error('You do not have operator privileges.');
        navigate('/');
        return;
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error('Error in role check:', error);
      navigate('/');
    }
  };

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('operator-bookings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('New booking:', payload);
          setNewRequestsCount(prev => prev + 1);
          toast.warning('🚨 New SOS Request!', {
            description: 'A new emergency request has been received.',
            duration: 10000,
          });
          loadBookings();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, emergency_contact, blood_group')
      .eq('user_id', userId)
      .maybeSingle();
    
    setSelectedBookingProfile(data);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: 'pending' | 'active' | 'completed' | 'cancelled') => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus}`);
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
    }
  };

  const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    await loadUserProfile(booking.user_id);
    setIsDetailsOpen(true);
  };

  const handleAssignClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsAssignModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      pending: { variant: 'outline', icon: AlertCircle },
      active: { variant: 'default', icon: Loader2 },
      completed: { variant: 'secondary', icon: CheckCircle2 },
      cancelled: { variant: 'destructive', icon: XCircle },
    };
    const { variant, icon: Icon } = config[status] || config.pending;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`w-3 h-3 ${status === 'active' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    // Tab filter
    if (activeTab !== 'all' && booking.status !== activeTab) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        booking.pickup_address?.toLowerCase().includes(query) ||
        booking.destination_address?.toLowerCase().includes(query) ||
        booking.driver_name?.toLowerCase().includes(query) ||
        booking.ambulance_number?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    active: bookings.filter(b => b.status === 'active').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    total: bookings.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb / Back Link */}
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Siren className="w-8 h-8 text-destructive" />
                Operator Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage and dispatch ambulances to emergency requests
              </p>
            </div>
            <div className="flex items-center gap-3">
              {newRequestsCount > 0 && (
                <Badge variant="destructive" className="animate-pulse gap-1">
                  <Bell className="w-3 h-3" />
                  {newRequestsCount} new
                </Badge>
              )}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-1"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="gap-1"
                >
                  <Map className="w-4 h-4" />
                  Map
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { loadBookings(); setNewRequestsCount(0); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className={stats.pending > 0 ? 'border-yellow-500 bg-yellow-500/5' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className={stats.active > 0 ? 'border-blue-500 bg-blue-500/5' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map View */}
          {viewMode === 'map' && (
            <div className="mb-8">
              <FleetMap
                bookings={bookings}
                onViewDetails={handleViewDetails}
                onAssign={handleAssignClick}
              />
            </div>
          )}

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Ambulance className="w-5 h-5" />
                  Emergency Requests
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
                <TabsList>
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="pending" className="gap-1">
                    Pending
                    {stats.pending > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center text-xs">
                        {stats.pending}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Table */}
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Ambulance className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No bookings found</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[140px]">Time</TableHead>
                        <TableHead>Pickup</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead className="w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow 
                          key={booking.id} 
                          className={booking.status === 'pending' ? 'bg-yellow-500/5' : ''}
                        >
                          <TableCell className="font-mono text-sm">
                            {new Date(booking.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              {new Date(booking.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2 text-sm">
                                {booking.pickup_address || 'Current Location'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="line-clamp-2 text-sm">
                              {booking.destination_address}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(booking.status)}</TableCell>
                          <TableCell>
                            {booking.driver_name ? (
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {booking.driver_name}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Truck className="w-3 h-3" />
                                  {booking.ambulance_number}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewDetails(booking)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAssignClick(booking)}
                                  >
                                    Assign
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    onClick={() => autoDispatch(booking)}
                                    disabled={isAutoDispatching}
                                  >
                                    {isAutoDispatching ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <RefreshCw className="w-4 h-4 mr-1" />
                                    )}
                                    Auto
                                  </Button>
                                </>
                              )}
                              {booking.status === 'active' && (
                                <Select
                                  onValueChange={(value) => updateBookingStatus(booking.id, value as any)}
                                >
                                  <SelectTrigger className="w-28 h-8">
                                    <SelectValue placeholder="Update" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="completed">Complete</SelectItem>
                                    <SelectItem value="cancelled">Cancel</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modals */}
      <AssignDriverModal
        open={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        booking={selectedBooking}
        onAssigned={loadBookings}
      />

      <BookingDetailsPanel
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        booking={selectedBooking}
        userProfile={selectedBookingProfile}
        onAssign={() => {
          setIsDetailsOpen(false);
          setIsAssignModalOpen(true);
        }}
        onUpdateStatus={(status) => {
          if (selectedBooking) {
            updateBookingStatus(selectedBooking.id, status);
          }
        }}
      />
    </div>
  );
};

export default OperatorDashboard;
