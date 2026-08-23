import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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

const VideoConsultation = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [medicineCount, setMedicineCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDoctors();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      // Fetch user's medicine and prescription counts
      const [medicinesRes, prescriptionsRes] = await Promise.all([
        supabase.from('user_medicines').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_active', true),
        supabase.from('uploaded_prescriptions').select('id', { count: 'exact' }).eq('user_id', user.id)
      ]);
      setMedicineCount(medicinesRes.count || 0);
      setPrescriptionCount(prescriptionsRes.count || 0);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('available', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
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
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a consultation",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // For now, book for the next available slot (1 hour from now)
    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + 1);

    try {
      const { data, error } = await supabase
        .from('video_consultations')
        .insert({
          user_id: user.id,
          doctor_id: doctor.id,
          scheduled_at: scheduledAt.toISOString(),
          amount: doctor.consultation_fee,
          duration_minutes: 15
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Consultation Booked!",
        description: `Your video consultation with ${doctor.name} is scheduled.`,
      });

      // Navigate to booking history or show option to start call
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleStartCall = (doctor: Doctor) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to start a consultation",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }

    // Navigate to video call with doctor info
    navigate(`/video-call?doctorId=${doctor.id}`);
  };

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

          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Video className="w-5 h-5" />
              <span className="font-medium">Video Consultation</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Consult Top Doctors <span className="text-primary">Online</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Affordable healthcare at your fingertips. Get expert medical advice from ₹149 only.
            </p>
          </div>

          {/* Upload Medicines/Prescriptions CTA */}
          {user && (
            <Card className="mb-8 bg-gradient-to-r from-blue-500/10 via-primary/10 to-purple-500/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                      <Pill className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Prepare for Your Consultation</h3>
                      <p className="text-muted-foreground text-sm">
                        Add your current medicines and upload prescriptions so doctors can review them
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
