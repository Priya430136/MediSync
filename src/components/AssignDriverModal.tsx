import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Phone, Truck, Clock } from 'lucide-react';

// Predefined drivers for quick selection
const AVAILABLE_DRIVERS = [
  { id: '1', name: 'Kartikey (Verified Sandbox)', phone: '+919717569478', vehicle: 'DL-9999-AMB' },
  { id: '2', name: 'Rajesh Kumar', phone: '+91 98765 43210', vehicle: 'DL-1234-AMB' },
  { id: '3', name: 'Amit Singh', phone: '+91 87654 32109', vehicle: 'DL-5678-AMB' },
  { id: '4', name: 'Suresh Sharma', phone: '+91 76543 21098', vehicle: 'DL-9012-AMB' },
  { id: '5', name: 'Vikram Patel', phone: '+91 65432 10987', vehicle: 'DL-3456-AMB' },
  { id: '6', name: 'Ravi Verma', phone: '+91 54321 09876', vehicle: 'DL-7890-AMB' },
];

interface AssignDriverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    pickup_address: string | null;
    destination_address: string | null;
  } | null;
  onAssigned: () => void;
}

const AssignDriverModal = ({ open, onOpenChange, booking, onAssigned }: AssignDriverModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [customDriver, setCustomDriver] = useState({
    name: '',
    phone: '',
    vehicle: '',
  });
  const [estimatedTime, setEstimatedTime] = useState('7');
  const [useCustomDriver, setUseCustomDriver] = useState(false);

  const handleAssign = async () => {
    if (!booking) return;

    const driver = useCustomDriver 
      ? customDriver 
      : AVAILABLE_DRIVERS.find(d => d.id === selectedDriver);

    if (!driver || !driver.name || !driver.phone || !driver.vehicle) {
      toast.error('Please fill in all driver details');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          driver_name: driver.name,
          driver_phone: driver.phone,
          ambulance_number: driver.vehicle,
          estimated_time: parseInt(estimatedTime),
          status: 'active',
        })
        .eq('id', booking.id);

      if (error) throw error;

      // Send notification to driver
      try {
        await supabase.functions.invoke('send-whatsapp-notification', {
          body: {
            phoneNumber: driver.phone,
            message: `🚑 NEW DISPATCH ALERT!\n\nPickup: ${booking.pickup_address || 'Current Location'}\nDestination: ${booking.destination_address}\nAmbulance: ${driver.vehicle}\nETA: ${estimatedTime} minutes\n\nPlease proceed immediately.`,
          },
        });
      } catch (notificationError) {
        console.error('Failed to notify driver:', notificationError);
      }

      toast.success(`Driver ${driver.name} assigned successfully!`);
      onAssigned();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to assign driver: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDriver('');
    setCustomDriver({ name: '', phone: '', vehicle: '' });
    setEstimatedTime('7');
    setUseCustomDriver(false);
  };

  const handleDriverSelect = (driverId: string) => {
    if (driverId === 'custom') {
      setUseCustomDriver(true);
      setSelectedDriver('');
    } else {
      setUseCustomDriver(false);
      setSelectedDriver(driverId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Assign Driver & Ambulance
          </DialogTitle>
          <DialogDescription>
            Assign a driver to this emergency request
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm">
            <p><strong>Pickup:</strong> {booking.pickup_address || 'Current Location'}</p>
            <p><strong>Destination:</strong> {booking.destination_address}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Driver Selection */}
          <div className="space-y-2">
            <Label>Select Driver</Label>
            <Select onValueChange={handleDriverSelect} value={useCustomDriver ? 'custom' : selectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver..." />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_DRIVERS.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{driver.name}</span>
                      <span className="text-muted-foreground">({driver.vehicle})</span>
                    </div>
                  </SelectItem>
                ))}
                <SelectItem value="custom">
                  <span className="text-primary">+ Add Custom Driver</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Driver Form */}
          {useCustomDriver && (
            <div className="space-y-3 p-4 border rounded-lg bg-background">
              <div className="space-y-2">
                <Label htmlFor="driverName" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Driver Name
                </Label>
                <Input
                  id="driverName"
                  placeholder="Enter driver name"
                  value={customDriver.name}
                  onChange={(e) => setCustomDriver({ ...customDriver, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPhone" className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  Phone Number
                </Label>
                <Input
                  id="driverPhone"
                  placeholder="+91 XXXXX XXXXX"
                  value={customDriver.phone}
                  onChange={(e) => setCustomDriver({ ...customDriver, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Ambulance Number
                </Label>
                <Input
                  id="vehicleNumber"
                  placeholder="DL-XXXX-AMB"
                  value={customDriver.vehicle}
                  onChange={(e) => setCustomDriver({ ...customDriver, vehicle: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ETA */}
          <div className="space-y-2">
            <Label htmlFor="eta" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Estimated Arrival Time (minutes)
            </Label>
            <Select value={estimatedTime} onValueChange={setEstimatedTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="7">7 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="20">20 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign & Dispatch'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDriverModal;
