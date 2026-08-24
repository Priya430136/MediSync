import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, getPublicUrl } from '@/utils/storage';
import { 
  FileText, 
  Calendar, 
  User, 
  Pill, 
  Download,
  Stethoscope,
  Clock,
  Loader2,
  ClipboardList,
  Upload,
  ExternalLink,
  Plus,
  ArrowLeft,
  Home
} from 'lucide-react';
import { format } from 'date-fns';

interface Medicine {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string | null;
}

interface Prescription {
  id: string;
  patient_name: string;
  patient_age: number | null;
  diagnosis: string;
  notes: string | null;
  created_at: string;
  doctors: {
    name: string;
    specialization: string;
  } | null;
}

interface UploadedPrescription {
  id: string;
  file_name: string;
  file_url: string;
  doctor_name: string | null;
  description: string | null;
  prescription_date: string | null;
  created_at: string;
}

const Prescriptions = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [uploadedPrescriptions, setUploadedPrescriptions] = useState<UploadedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    doctor_name: '',
    description: '',
    prescription_date: format(new Date(), 'yyyy-MM-dd'),
    file: null as File | null
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const [userRole, setUserRole] = useState<string>('patient');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);

    let role = user.user_metadata?.role;
    if (!role && user.email) {
      if (user.email.toLowerCase().includes('doctor')) role = 'doctor';
      else if (user.email.toLowerCase().includes('driver')) role = 'driver';
      else if (user.email.toLowerCase().includes('operator')) role = 'operator';
      else if (user.email.toLowerCase().includes('hospital')) role = 'hospital';
      else if (user.email.toLowerCase().includes('admin')) role = 'admin';
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role) role = profile.role;
    setUserRole(role || 'patient');

    fetchPrescriptions(user.id, role === 'doctor');
    fetchUploadedPrescriptions(user.id);
  };

  const fetchPrescriptions = async (userId: string, isDoc?: boolean) => {
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          doctors (name, specialization)
        `)
        .order('created_at', { ascending: false });

      if (!isDoc) {
        query = query.eq('patient_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  const fetchUploadedPrescriptions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('uploaded_prescriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedPrescriptions(data || []);
    } catch (error) {
      console.error('Error fetching uploaded prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadForm.file) return;

    setUploading(true);
    try {
      const file = uploadForm.file;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      await uploadFile('prescriptions', filePath, file);
      const fileUrl = getPublicUrl('prescriptions', filePath);

      const { error } = await supabase
        .from('uploaded_prescriptions')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_url: fileUrl,
          doctor_name: uploadForm.doctor_name,
          description: uploadForm.description,
          prescription_date: uploadForm.prescription_date,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Prescription uploaded successfully",
      });
      
      setUploadDialogOpen(false);
      setUploadForm({
        doctor_name: '',
        description: '',
        prescription_date: format(new Date(), 'yyyy-MM-dd'),
        file: null
      });
      fetchUploadedPrescriptions(user.id);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const viewPrescriptionDetails = async (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    
    try {
      const { data, error } = await supabase
        .from('prescription_medicines')
        .select('*')
        .eq('prescription_id', prescription.id);

      if (error) throw error;
      setMedicines(data || []);
      setDialogOpen(true);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to load prescription details",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    if (!selectedPrescription) return;
    
    // Create a printable HTML content
    const content = `
      <html>
        <head>
          <title>Prescription - ${selectedPrescription.patient_name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #e11d48; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #e11d48; margin: 0; }
            .patient-info { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .diagnosis { margin: 20px 0; padding: 15px; background: #fef2f2; border-radius: 8px; }
            .medicines { margin-top: 20px; }
            .medicine { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 8px; }
            .medicine h4 { margin: 0 0 10px 0; color: #e11d48; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RapidResQ</h1>
            <p>Digital Prescription</p>
          </div>
          <div class="patient-info">
            <strong>Patient:</strong> ${selectedPrescription.patient_name}<br>
            ${selectedPrescription.patient_age ? `<strong>Age:</strong> ${selectedPrescription.patient_age} years<br>` : ''}
            <strong>Date:</strong> ${format(new Date(selectedPrescription.created_at), 'PPP')}<br>
            ${selectedPrescription.doctors ? `<strong>Doctor:</strong> ${selectedPrescription.doctors.name} (${selectedPrescription.doctors.specialization})` : ''}
          </div>
          <div class="diagnosis">
            <strong>Diagnosis:</strong> ${selectedPrescription.diagnosis}
            ${selectedPrescription.notes ? `<br><strong>Notes:</strong> ${selectedPrescription.notes}` : ''}
          </div>
          <div class="medicines">
            <h3>Prescribed Medicines</h3>
            ${medicines.map(med => `
              <div class="medicine">
                <h4>${med.medicine_name}</h4>
                <p><strong>Dosage:</strong> ${med.dosage}</p>
                <p><strong>Frequency:</strong> ${med.frequency}</p>
                <p><strong>Duration:</strong> ${med.duration}</p>
                ${med.instructions ? `<p><strong>Instructions:</strong> ${med.instructions}</p>` : ''}
              </div>
            `).join('')}
          </div>
          <div class="footer">
            <p>This is a digitally generated prescription from RapidResQ</p>
            <p>For any queries, contact: support@rapidresq.com</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Breadcrumb / Navigation */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
            <Link 
              to={userRole === 'doctor' ? "/doctor-portal" : "/"} 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{userRole === 'doctor' ? "Back to Doctor Workspace" : "Back to Home"}</span>
            </Link>
            {userRole === 'doctor' && (
              <Link 
                to="/doctor-portal" 
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-lg px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20"
              >
                🩺 Active Patient Queue
              </Link>
            )}
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {userRole === 'doctor' ? (
                  <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold">
                    <Stethoscope className="w-3.5 h-3.5 mr-1" /> Doctor Prescription Records
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-blue-700 dark:text-blue-300 border-blue-500/30 bg-blue-500/10 text-xs font-semibold">
                    <FileText className="w-3.5 h-3.5 mr-1" /> Patient Medical Records
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {userRole === 'doctor' ? "Issued Prescriptions & Records" : "Medical Records"}
              </h1>
              <p className="text-muted-foreground">
                {userRole === 'doctor' 
                  ? "View, inspect, and issue validated clinical prescriptions for patients" 
                  : "Manage your digital prescriptions and uploaded medical records"}
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {userRole === 'doctor' && (
                <Button onClick={() => navigate('/create-prescription')} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4" />
                  Write Prescription
                </Button>
              )}
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant={userRole === 'doctor' ? "outline" : "default"} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Record
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Medical Record</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleFileUpload} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor Name (Optional)</Label>
                    <Input 
                      id="doctor" 
                      placeholder="Dr. Smith"
                      value={uploadForm.doctor_name}
                      onChange={(e) => setUploadForm({...uploadForm, doctor_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date of Prescription</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={uploadForm.prescription_date}
                      onChange={(e) => setUploadForm({...uploadForm, prescription_date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description / Notes</Label>
                    <Input 
                      id="desc" 
                      placeholder="Annual checkup report"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File (PDF, Image)</Label>
                    <Input 
                      id="file" 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Record"
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          <Tabs defaultValue="digital" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
              <TabsTrigger value="digital">Digital Prescriptions</TabsTrigger>
              <TabsTrigger value="uploaded">Uploaded Records</TabsTrigger>
            </TabsList>

            <TabsContent value="digital" className="space-y-4">
              {prescriptions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Digital Prescriptions</h3>
                    <p className="text-muted-foreground mb-6">
                      Your prescriptions from video consultations will appear here
                    </p>
                    <Button onClick={() => navigate('/video-consultation')} className="gap-2">
                      <Stethoscope className="w-4 h-4" />
                      Book a Consultation
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {prescriptions.map(prescription => (
                    <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{prescription.diagnosis}</h3>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(prescription.created_at), 'PPP')}
                                </span>
                                {prescription.doctors && (
                                  <span className="flex items-center gap-1">
                                    <Stethoscope className="w-4 h-4" />
                                    {prescription.doctors.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            onClick={() => viewPrescriptionDetails(prescription)}
                            className="shrink-0"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="uploaded" className="space-y-4">
              {uploadedPrescriptions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Uploaded Records</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your scanned prescriptions or medical reports to keep them safe
                    </p>
                    <Button onClick={() => setUploadDialogOpen(true)} variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Upload Your First Record
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {uploadedPrescriptions.map(record => (
                    <Card key={record.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{record.file_name}</h3>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                {record.prescription_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(record.prescription_date), 'PPP')}
                                  </span>
                                )}
                                {record.doctor_name && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {record.doctor_name}
                                  </span>
                                )}
                              </div>
                              {record.description && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {record.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="outline"
                            className="shrink-0 gap-2"
                            asChild
                          >
                            <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                              View Record
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Prescription Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Prescription Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedPrescription && (
            <div className="space-y-6">
              {/* Patient & Doctor Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium">Patient</span>
                    </div>
                    <p className="text-lg font-semibold">{selectedPrescription.patient_name}</p>
                    {selectedPrescription.patient_age && (
                      <p className="text-sm text-muted-foreground">{selectedPrescription.patient_age} years old</p>
                    )}
                  </CardContent>
                </Card>
                
                {selectedPrescription.doctors && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-primary" />
                        <span className="font-medium">Doctor</span>
                      </div>
                      <p className="text-lg font-semibold">{selectedPrescription.doctors.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPrescription.doctors.specialization}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Diagnosis */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Diagnosis</h4>
                  <p className="text-foreground">{selectedPrescription.diagnosis}</p>
                  {selectedPrescription.notes && (
                    <div className="mt-3 pt-3 border-t border-primary/20">
                      <h4 className="font-medium mb-1 text-sm">Doctor's Notes</h4>
                      <p className="text-sm text-muted-foreground">{selectedPrescription.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medicines */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-primary" />
                  Prescribed Medicines
                </h4>
                <div className="space-y-3">
                  {medicines.map((med, index) => (
                    <Card key={med.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-primary">{med.medicine_name}</h5>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Dosage:</span>
                                <p className="font-medium">{med.dosage}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Frequency:</span>
                                <p className="font-medium">{med.frequency}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <p className="font-medium">{med.duration}</p>
                              </div>
                            </div>
                            {med.instructions && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <span className="font-medium">Instructions:</span> {med.instructions}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">#{index + 1}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Date & Download */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Issued on {format(new Date(selectedPrescription.created_at), 'PPP')}
                </div>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download / Print
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;