import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Building2,
  Bed,
  Users,
  Ambulance,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  Activity,
  Loader2,
  RefreshCw,
  Heart,
  Stethoscope,
  Syringe,
  Baby,
  Brain,
  Bone,
  Eye,
  Pill,
  TrendingUp,
  Bell,
  User,
  Droplet,
  FileText,
  ArrowLeft,
  Home,
} from 'lucide-react';

interface IncomingPatient {
  id: string;
  pickup_address: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  ambulance_number: string | null;
  estimated_time: number | null;
  created_at: string;
  status: string;
  user_id: string;
}

interface PatientProfile {
  full_name: string | null;
  phone: string | null;
  blood_group: string | null;
  emergency_contact: string | null;
}

interface Department {
  id: string;
  name: string;
  icon: React.ReactNode;
  totalBeds: number;
  occupiedBeds: number;
  available: boolean;
}

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [incomingPatients, setIncomingPatients] = useState<IncomingPatient[]>([]);
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfile>>({});
  const [activeTab, setActiveTab] = useState('incoming');
  const [hospitalStatus, setHospitalStatus] = useState({
    acceptingEmergencies: true,
    acceptingAmbulances: true,
  });

  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Emergency', icon: <AlertCircle className="w-5 h-5" />, totalBeds: 20, occupiedBeds: 14, available: true },
    { id: '2', name: 'ICU', icon: <Activity className="w-5 h-5" />, totalBeds: 15, occupiedBeds: 12, available: true },
    { id: '3', name: 'Cardiology', icon: <Heart className="w-5 h-5" />, totalBeds: 25, occupiedBeds: 18, available: true },
    { id: '4', name: 'Orthopedics', icon: <Bone className="w-5 h-5" />, totalBeds: 30, occupiedBeds: 22, available: true },
    { id: '5', name: 'Neurology', icon: <Brain className="w-5 h-5" />, totalBeds: 20, occupiedBeds: 15, available: true },
    { id: '6', name: 'Pediatrics', icon: <Baby className="w-5 h-5" />, totalBeds: 25, occupiedBeds: 10, available: true },
    { id: '7', name: 'General Medicine', icon: <Stethoscope className="w-5 h-5" />, totalBeds: 50, occupiedBeds: 35, available: true },
    { id: '8', name: 'Surgery', icon: <Syringe className="w-5 h-5" />, totalBeds: 15, occupiedBeds: 8, available: true },
  ]);

  useEffect(() => {
    checkHospitalRole();
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      loadIncomingPatients();
      const channel = supabase
        .channel('hospital-bookings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'bookings' },
          () => loadIncomingPatients()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthorized]);

  const checkHospitalRole = async () => {
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

      const hasAccess = profile?.role === 'hospital' || profile?.role === 'admin' || profile?.role === 'operator';
      
      if (!hasAccess) {
        toast.error('You do not have hospital access.');
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

  const loadIncomingPatients = async () => {
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const patients = (data || []) as IncomingPatient[];
      setIncomingPatients(patients);

      // Load profiles for all patients
      for (const patient of patients) {
        if (!patientProfiles[patient.user_id]) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, blood_group, emergency_contact')
            .eq('user_id', patient.user_id)
            .maybeSingle();
          
          if (profile) {
            setPatientProfiles(prev => ({ ...prev, [patient.user_id]: profile }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const updateBedCount = (deptId: string, change: number) => {
    setDepartments(prev => prev.map(dept => {
      if (dept.id === deptId) {
        const newOccupied = Math.max(0, Math.min(dept.totalBeds, dept.occupiedBeds + change));
        return { ...dept, occupiedBeds: newOccupied };
      }
      return dept;
    }));
    toast.success(change > 0 ? 'Bed occupied' : 'Bed freed');
  };

  const toggleDepartment = (deptId: string) => {
    setDepartments(prev => prev.map(dept => {
      if (dept.id === deptId) {
        const newAvailable = !dept.available;
        toast.info(`${dept.name} is now ${newAvailable ? 'accepting' : 'not accepting'} patients`);
        return { ...dept, available: newAvailable };
      }
      return dept;
    }));
  };

  const markPatientArrived = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', patientId);

      if (error) throw error;
      toast.success('Patient marked as arrived');
      loadIncomingPatients();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update patient status');
    }
  };

  const totalBeds = departments.reduce((acc, d) => acc + d.totalBeds, 0);
  const occupiedBeds = departments.reduce((acc, d) => acc + d.occupiedBeds, 0);
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Hospital Dashboard</h1>
                <p className="text-muted-foreground">City General Hospital</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-sm">Accepting Emergencies</span>
                <Switch
                  checked={hospitalStatus.acceptingEmergencies}
                  onCheckedChange={(checked) => {
                    setHospitalStatus(prev => ({ ...prev, acceptingEmergencies: checked }));
                    toast.info(checked ? 'Now accepting emergencies' : 'Emergency intake paused');
                  }}
                />
              </div>
              <Button variant="outline" size="sm" onClick={loadIncomingPatients}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Beds</p>
                    <p className="text-3xl font-bold">{totalBeds}</p>
                  </div>
                  <Bed className="w-8 h-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-3xl font-bold text-green-600">{availableBeds}</p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Incoming</p>
                    <p className="text-3xl font-bold text-amber-600">{incomingPatients.length}</p>
                  </div>
                  <Ambulance className="w-8 h-8 text-amber-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Occupancy</p>
                    <p className="text-3xl font-bold">{occupancyRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
                </div>
                <Progress value={occupancyRate} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="incoming" className="gap-2">
                <Ambulance className="w-4 h-4" />
                Incoming Patients
                {incomingPatients.length > 0 && (
                  <Badge variant="destructive" className="ml-1">{incomingPatients.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="w-4 h-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="beds" className="gap-2">
                <Bed className="w-4 h-4" />
                Bed Management
              </TabsTrigger>
            </TabsList>

            {/* Incoming Patients Tab */}
            <TabsContent value="incoming">
              {incomingPatients.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Ambulance className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Incoming Patients</h3>
                    <p className="text-muted-foreground">All clear! No ambulances en route.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {incomingPatients.map((patient) => {
                    const profile = patientProfiles[patient.user_id];
                    return (
                      <Card key={patient.id} className="border-l-4 border-l-red-500 animate-fade-in">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge variant="destructive" className="animate-pulse gap-1">
                                  <Activity className="w-3 h-3" />
                                  EN ROUTE
                                </Badge>
                                {patient.estimated_time && (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="w-3 h-3" />
                                    ETA: {patient.estimated_time} min
                                  </Badge>
                                )}
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Patient Info */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Patient Information
                                  </h4>
                                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Name:</span> {profile?.full_name || 'Unknown'}</p>
                                    <p className="flex items-center gap-2">
                                      <span className="text-muted-foreground">Blood Group:</span>
                                      {profile?.blood_group ? (
                                        <Badge variant="outline" className="border-red-500 text-red-500">
                                          <Droplet className="w-3 h-3 mr-1" />
                                          {profile.blood_group}
                                        </Badge>
                                      ) : 'Unknown'}
                                    </p>
                                    <p><span className="text-muted-foreground">Phone:</span> {profile?.phone || 'N/A'}</p>
                                    <p><span className="text-muted-foreground">Emergency Contact:</span> {profile?.emergency_contact || 'N/A'}</p>
                                  </div>
                                </div>

                                {/* Ambulance Info */}
                                <div className="space-y-2">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Ambulance className="w-4 h-4" />
                                    Ambulance Details
                                  </h4>
                                  <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Ambulance:</span> {patient.ambulance_number || 'N/A'}</p>
                                    <p><span className="text-muted-foreground">Driver:</span> {patient.driver_name || 'N/A'}</p>
                                    <p><span className="text-muted-foreground">Driver Phone:</span> {patient.driver_phone || 'N/A'}</p>
                                    <p className="flex items-start gap-1">
                                      <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                      <span className="line-clamp-2">{patient.pickup_address || 'Location tracking'}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 min-w-[150px]">
                              <Button
                                className="bg-green-500 hover:bg-green-600"
                                onClick={() => markPatientArrived(patient.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Mark Arrived
                              </Button>
                              {patient.driver_phone && (
                                <Button
                                  variant="outline"
                                  onClick={() => window.open(`tel:${patient.driver_phone}`)}
                                >
                                  <Phone className="w-4 h-4 mr-2" />
                                  Call Driver
                                </Button>
                              )}
                              <Button variant="outline">
                                <FileText className="w-4 h-4 mr-2" />
                                Prepare Bed
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {departments.map((dept) => {
                  const available = dept.totalBeds - dept.occupiedBeds;
                  const occupancy = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
                  
                  return (
                    <Card key={dept.id} className={!dept.available ? 'opacity-60' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              dept.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              {dept.icon}
                            </div>
                            <CardTitle className="text-base">{dept.name}</CardTitle>
                          </div>
                          <Switch
                            checked={dept.available}
                            onCheckedChange={() => toggleDepartment(dept.id)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Beds Available</span>
                            <span className="font-semibold text-green-600">{available}/{dept.totalBeds}</span>
                          </div>
                          <Progress value={occupancy} className="h-2" />
                          <p className="text-xs text-muted-foreground text-center">
                            {occupancy}% Occupancy
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Bed Management Tab */}
            <TabsContent value="beds">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Bed Management</CardTitle>
                  <CardDescription>Update bed availability across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments.map((dept) => {
                      const available = dept.totalBeds - dept.occupiedBeds;
                      const occupancy = Math.round((dept.occupiedBeds / dept.totalBeds) * 100);
                      
                      return (
                        <div key={dept.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            {dept.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{dept.name}</span>
                              <span className={`text-sm font-semibold ${
                                available > 5 ? 'text-green-600' : available > 0 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                {available} beds available
                              </span>
                            </div>
                            <Progress value={occupancy} className="h-2" />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBedCount(dept.id, -1)}
                              disabled={dept.occupiedBeds === 0}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-mono">
                              {dept.occupiedBeds}/{dept.totalBeds}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBedCount(dept.id, 1)}
                              disabled={dept.occupiedBeds === dept.totalBeds}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboard;
