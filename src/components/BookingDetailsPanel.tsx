import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  MapPin, 
  Navigation, 
  User, 
  Phone, 
  Clock, 
  Calendar,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface BookingDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    pickup_address: string | null;
    destination_address: string | null;
    pickup_location: { lat: number; lng: number };
    destination_location: { lat: number; lng: number };
    status: string;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    driver_name: string | null;
    driver_phone: string | null;
    ambulance_number: string | null;
    estimated_time: number | null;
    distance: number | null;
    user_id: string;
  } | null;
  userProfile?: {
    full_name: string | null;
    phone: string | null;
    emergency_contact: string | null;
    blood_group: string | null;
  } | null;
  onAssign: () => void;
  onUpdateStatus: (status: 'pending' | 'active' | 'completed' | 'cancelled') => void;
}

const BookingDetailsPanel = ({ 
  open, 
  onOpenChange, 
  booking, 
  userProfile,
  onAssign, 
  onUpdateStatus 
}: BookingDetailsProps) => {
  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; color: string }> = {
      pending: { variant: 'outline', icon: AlertCircle, color: 'text-yellow-500' },
      active: { variant: 'default', icon: Loader2, color: 'text-blue-500' },
      completed: { variant: 'secondary', icon: CheckCircle2, color: 'text-green-500' },
      cancelled: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
    };
    const { variant, icon: Icon, color } = config[status] || config.pending;
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`w-3 h-3 ${status === 'active' ? 'animate-spin' : ''}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            {getStatusBadge(booking.status)}
          </SheetTitle>
          <SheetDescription>
            ID: {booking.id.slice(0, 8)}...
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Location Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Location Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Pickup Location</p>
                  <p className="font-medium">{booking.pickup_address || 'Current Location'}</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-xs"
                    onClick={() => openInMaps(booking.pickup_location.lat, booking.pickup_location.lng)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in Maps
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{booking.destination_address}</p>
                </div>
              </div>
              {booking.distance && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Distance: <strong>{booking.distance} km</strong></span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Patient Information */}
          {userProfile && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{userProfile.full_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{userProfile.phone || 'Not provided'}</span>
                </div>
                {userProfile.blood_group && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Blood Group</span>
                    <Badge variant="destructive">{userProfile.blood_group}</Badge>
                  </div>
                )}
                {userProfile.emergency_contact && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Emergency Contact</span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(`tel:${userProfile.emergency_contact}`)}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {userProfile.emergency_contact}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Driver Information */}
          {booking.driver_name && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Assigned Driver</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{booking.driver_name}</p>
                    <p className="text-sm text-muted-foreground">{booking.ambulance_number}</p>
                  </div>
                </div>
                {booking.driver_phone && (
                  <Button 
                    className="w-full gap-2" 
                    variant="outline"
                    onClick={() => window.open(`tel:${booking.driver_phone}`)}
                  >
                    <Phone className="w-4 h-4" />
                    Call Driver: {booking.driver_phone}
                  </Button>
                )}
                {booking.estimated_time && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>ETA: <strong>{booking.estimated_time} minutes</strong></span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Created: {formatDateTime(booking.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Updated: {formatDateTime(booking.updated_at)}</span>
              </div>
              {booking.completed_at && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Completed: {formatDateTime(booking.completed_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            {booking.status === 'pending' && (
              <Button className="w-full" onClick={onAssign}>
                <Truck className="w-4 h-4 mr-2" />
                Assign Driver & Dispatch
              </Button>
            )}
            
            {booking.status === 'active' && (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="default" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onUpdateStatus('completed')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => onUpdateStatus('cancelled')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}

            {(booking.status === 'completed' || booking.status === 'cancelled') && (
              <p className="text-center text-muted-foreground text-sm">
                This booking is {booking.status}. No further actions available.
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingDetailsPanel;
