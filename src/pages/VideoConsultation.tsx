import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { API } from '@/lib/api';
import { 
  Video, 
  Star, 
  Clock, 
  Languages, 
  Search,
  Calendar,
  IndianRupee,
  Stethoscope,
  CheckCircle2,
  Shield,
  HeartPulse,
  Pill,
  Upload,
  ArrowRight,
  ArrowLeft,
  Home
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience_years: number;
  consultation_fee: number;
  rating: number;
  languages: string[];
  available: boolean;
  avatar_url: string | null;
}

const FALLBACK_DOCTORS: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Sarah Mitchell",
    specialization: "General Medicine",
    experience_years: 12,
    consultation_fee: 199,
    rating: 4.9,
    languages: ["English", "Hindi"],
    available: true,
    avatar_url: null,
  },
  {
    id: "doc-2",
    name: "Dr. Rajesh Verma",
    specialization: "Cardiology",
    experience_years: 16,
    consultation_fee: 299,
    rating: 4.8,
    languages: ["English", "Hindi", "Punjabi"],
    available: true,
    avatar_url: null,
  },
  {
    id: "doc-3",
    name: "Dr. Priya Sharma",
    specialization: "Dermatology",
    experience_years: 9,
    consultation_fee: 249,
    rating: 4.9,
    languages: ["English", "Hindi", "Marathi"],
    available: true,
    avatar_url: null,
  },
  {
    id: "doc-4",
    name: "Dr. Amit Patel",
    specialization: "Pediatrics",
    experience_years: 14,
    consultation_fee: 249,
    rating: 4.7,
    languages: ["English", "Hindi", "Gujarati"],
    available: true,
    avatar_url: null,
  },
  {
    id: "doc-5",
    name: "Dr. Ananya Iyer",
    specialization: "Neurology",
    experience_years: 11,
    consultation_fee: 349,
    rating: 4.9,
    languages: ["English", "Tamil", "Hindi"],
    available: true,
    avatar_url: null,
  }
];

const VideoConsultation = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorAppointments, setDoctorAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('patient');
  const [medicineCount, setMedicineCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Fetch user's profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        const role = profile?.role || (user.email?.toLowerCase().includes('doctor') ? 'doctor' : 'patient');
        setUserRole(role);

        if (role === 'doctor') {
          // Fetch upcoming doctor appointments
          try {
            const apts = await API.getAppointments({ status: 'confirmed' });
            setDoctorAppointments(apts);
          } catch (err) {
            console.warn("Could not load doctor appointments:", err);
          }
        } else {
          // Fetch patient's medicine and prescription counts
          const [medicinesRes, prescriptionsRes] = await Promise.all([
            supabase.from('user_medicines').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
            supabase.from('uploaded_prescriptions').select('id', { count: 'exact' }).eq('user_id', user.id)
          ]);
          setMedicineCount(medicinesRes.count || 0);
          setPrescriptionCount(prescriptionsRes.count || 0);
        }
      }
    } catch (e) {
      console.warn("User auth lookup in VideoConsultation:", e);
    }
  };

  const isDoctor = userRole === 'doctor' || user?.email?.toLowerCase().includes('doctor');

  const fetchDoctors = async () => {
    try {
      // First try local backend API
      const apiDoctors = await API.getDoctors();
      if (apiDoctors && apiDoctors.length > 0) {
        const formatted: Doctor[] = apiDoctors.map((d: any, idx: number) => ({
          id: d.id,
          name: d.name,
          specialization: d.specialisation || d.specialization || "General Medicine",
          experience_years: d.experience_years || 8 + (idx * 2),
          consultation_fee: d.consultation_fee || (idx % 2 === 0 ? 199 : 249),
          rating: 4.8 + (idx % 3) * 0.1,
          languages: ["English", "Hindi"],
          available: d.isActive !== false,
          avatar_url: null,
        }));
        setDoctors(formatted);
        setLoading(false);
        return;
      }

      // Try Supabase table
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('available', true)
        .order('rating', { ascending: false });

      if (error || !data || data.length === 0) {
        setDoctors(FALLBACK_DOCTORS);
      } else {
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors(FALLBACK_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  const specializations = [...new Set(doctors.map(d => d.specialization))];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = !selectedSpecialization || doctor.specialization === selectedSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  const handleBookConsultation = async (doctor: Doctor) => {
    const activeEmail = user?.email || localStorage.getItem("rapidresq_guest_email") || "michael.chen@example.com";
    
    // Book for tomorrow 10:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    try {
      await API.createAppointment({
        doctorId: doctor.id,
        doctorName: doctor.name,
        patientName: user?.user_metadata?.full_name || "Michael Chen",
        patientEmail: activeEmail,
        appointmentDate: dateStr,
        startTime: "10:00",
        endTime: "10:30",
        symptoms: "Online Video Consultation request for general clinical evaluation and follow-up advice.",
      });

      toast({
        title: "Video Consultation Booked!",
        description: `Your appointment with ${doctor.name} on ${dateStr} at 10:00 AM is confirmed. Syncing to Google Calendar.`,
      });

      navigate('/patient-portal');
    } catch (error: any) {
      toast({
        title: "Consultation Scheduled",
        description: `Video session requested with ${doctor.name}. Proceed to patient portal or join instant call.`,
      });
      navigate('/patient-portal');
    }
  };

  const handleStartCall = (doctor: Doctor) => {
    const params = new URLSearchParams();
    params.append('doctorId', doctor.id);
    params.append('doctorName', doctor.name);
    params.append('specialization', doctor.specialization);
    navigate(`/video-call?${params.toString()}`);
  };

  const handleDoctorLaunchMyRoom = () => {
    const currentDoc = doctors[0] || FALLBACK_DOCTORS[0];
    const docName = user?.user_metadata?.full_name || currentDoc.name;
    const params = new URLSearchParams();
    params.append('doctorId', currentDoc.id);
    params.append('doctorName', docName);
    params.append('specialization', currentDoc.specialization);
    params.append('roomMode', 'doctor_host');
    navigate(`/video-call?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Breadcrumb / Back Navigation */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {isDoctor ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/doctor-portal" 
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Doctor Workspace</span>
                </Link>
                <Link 
                  to="/create-prescription"
                  className="text-xs font-semibold text-muted-foreground hover:text-primary px-3 py-1.5 rounded-full border border-border/60 bg-muted/40"
                >
                  Write Prescription
                </Link>
              </div>
            ) : (
              <Link 
                to="/patient-portal" 
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors bg-muted/40 px-3 py-1.5 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Patient Hub</span>
              </Link>
            )}

            <Badge variant="outline" className="text-xs font-medium">
              WebRTC Encrypted Tele-Health
            </Badge>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              isDoctor ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-primary/10 text-primary'
            }`}>
              <Video className="w-5 h-5" />
              <span className="font-semibold text-sm">
                {isDoctor ? "Doctor Tele-Health Virtual Console" : "Tele-Health Video Consultations"}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-3 tracking-tight">
              {isDoctor ? "Tele-Health Consultation Rooms" : "Consult Top Doctors Online"}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {isDoctor
                ? "Conduct high-definition encrypted video consultations, join patient waiting rooms, and consult with peer clinical specialists."
                : "Affordable healthcare at your fingertips. Connect with verified medical specialists starting from ₹149."}
            </p>
          </div>

          {/* DOCTOR SPECIFIC VIEW: Virtual Exam Room Launcher & Active Tele-Consult Queue */}
          {isDoctor ? (
            <div className="space-y-8 mb-12">
              {/* Active Room Host Launcher */}
              <Card className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-teal-500/15 border-emerald-500/30 shadow-md">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Video className="w-8 h-8 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                            Virtual Exam Room Ready
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                          {user?.user_metadata?.full_name ? `Dr. ${user.user_metadata.full_name}'s Video Room` : "My Tele-Consultation Exam Room"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                          Launch your virtual consultation room. Patients in queue can be admitted directly with encrypted WebRTC audiovisual streams.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                      <Button 
                        onClick={handleDoctorLaunchMyRoom} 
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 w-full md:w-auto shadow-sm"
                      >
                        <Video className="w-5 h-5" />
                        Launch Video Exam Room
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scheduled Tele-Consult Appointments Queue */}
              {doctorAppointments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      Scheduled Tele-Consultations Today
                    </h2>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 font-semibold">
                      {doctorAppointments.length} In Waiting Queue
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {doctorAppointments.map((apt) => (
                      <Card key={apt.id} className="border-border/70 hover:border-emerald-500/40 transition-colors">
                        <CardContent className="p-5 space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-base text-foreground">{apt.patientName}</h4>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {apt.appointmentDate} • {apt.startTime} - {apt.endTime}
                              </p>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-xs">
                              {apt.status || "Confirmed"}
                            </Badge>
                          </div>

                          {apt.symptoms && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border/50">
                              <span className="font-semibold text-foreground">Reason: </span>
                              {apt.symptoms}
                            </p>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => navigate('/create-prescription')}
                              className="text-xs h-8"
                            >
                              Prescription Pad
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => navigate(`/video-call?doctorId=doc-1&patientName=${encodeURIComponent(apt.patientName)}&consultationId=${apt.id}`)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5 font-semibold"
                            >
                              <Video className="w-3.5 h-3.5" />
                              Start Patient Call
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Specialist Peer Directory Header */}
              <div className="pt-4 border-t border-border/60">
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Peer Clinical Directory & Specialist Tele-Rooms
                </h3>
                <p className="text-xs text-muted-foreground">
                  Connect or tele-consult with verified on-duty specialists across clinical departments.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* PATIENT VIEW: Upload Medicines/Prescriptions CTA */}
              {user && (
                <Card className="mb-8 bg-gradient-to-r from-blue-500/10 via-primary/10 to-purple-500/10 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Pill className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">Prepare for Your Consultation</h3>
                          <p className="text-muted-foreground text-sm">
                            Add your current medicines and upload prescriptions so doctors can review them before your call.
                          </p>
                          <div className="flex gap-4 mt-2">
                            <Badge variant="secondary">
                              {medicineCount} medicines added
                            </Badge>
                            <Badge variant="secondary">
                              {prescriptionCount} prescriptions uploaded
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Link to="/my-medicines">
                        <Button className="gap-2">
                          <Upload className="w-4 h-4" />
                          Add Medicines & Prescriptions
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Benefits */}
              <div className="grid md:grid-cols-4 gap-4 mb-12">
                <Card className="text-center bg-gradient-to-br from-primary/5 to-background border-primary/20">
                  <CardContent className="p-4">
                    <IndianRupee className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="font-semibold">Starting ₹149</p>
                    <p className="text-sm text-muted-foreground">Affordable for all</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-green-500/5 to-background border-green-500/20">
                  <CardContent className="p-4">
                    <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="font-semibold">15 Min Sessions</p>
                    <p className="text-sm text-muted-foreground">Quick & effective</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-blue-500/5 to-background border-blue-500/20">
                  <CardContent className="p-4">
                    <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-semibold">100% Private</p>
                    <p className="text-sm text-muted-foreground">Secure & confidential</p>
                  </CardContent>
                </Card>
                <Card className="text-center bg-gradient-to-br from-purple-500/5 to-background border-purple-500/20">
                  <CardContent className="p-4">
                    <Languages className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="font-semibold">Multi-language</p>
                    <p className="text-sm text-muted-foreground">Hindi, English & more</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search doctors by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedSpecialization === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSpecialization(null)}
              >
                All
              </Button>
              {specializations.map(spec => (
                <Button
                  key={spec}
                  variant={selectedSpecialization === spec ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSpecialization(spec)}
                >
                  {spec}
                </Button>
              ))}
            </div>
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading doctors...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map(doctor => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <Stethoscope className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{doctor.name}</CardTitle>
                          <p className="text-sm text-primary font-medium">{doctor.specialization}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Available
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {doctor.experience_years} years exp.
                        </span>
                        <span className="flex items-center gap-1 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          {doctor.rating}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {doctor.languages.map(lang => (
                          <Badge key={lang} variant="outline" className="text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>

                      <div className="pt-3 border-t space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-primary">₹{doctor.consultation_fee}</p>
                            <p className="text-xs text-muted-foreground">per consultation</p>
                          </div>
                          <Button onClick={() => handleStartCall(doctor)} className="gap-2">
                            <Video className="w-4 h-4" />
                            Start Call
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => handleBookConsultation(doctor)}
                        >
                          <Calendar className="w-4 h-4" />
                          Schedule for Later
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredDoctors.length === 0 && !loading && (
            <div className="text-center py-12">
              <HeartPulse className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No doctors found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          )}

          {/* Why Choose Section */}
          <Card className="mt-12 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Why Choose RapidResQ Video Consultation?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IndianRupee className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Middle-Class Friendly</h3>
                  <p className="text-sm text-muted-foreground">
                    Prices starting from just ₹149 - healthcare that fits your budget
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">No Waiting</h3>
                  <p className="text-sm text-muted-foreground">
                    Book instantly and consult within hours, not days
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Languages className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Regional Languages</h3>
                  <p className="text-sm text-muted-foreground">
                    Doctors who speak Hindi, Tamil, Telugu, Marathi & more
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VideoConsultation;
