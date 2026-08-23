import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Pill, 
  Upload, 
  Plus, 
  Trash2, 
  FileImage,
  Calendar,
  User,
  Loader2,
  X,
  Eye,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Home
} from 'lucide-react';
import { format } from 'date-fns';

interface Medicine {
  id: string;
  medicine_name: string;
  dosage: string | null;
  frequency: string | null;
  started_date: string | null;
  notes: string | null;
  is_active: boolean;
  reminder_time?: string | null;
}

interface UploadedPrescription {
  id: string;
  file_name: string;
  file_url: string;
  description: string | null;
  prescription_date: string | null;
  doctor_name: string | null;
  created_at: string;
}

const MyMedicines = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<UploadedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [medicineDialogOpen, setMedicineDialogOpen] = useState(false);
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [savingMedicine, setSavingMedicine] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Medicine form state
  const [medicineForm, setMedicineForm] = useState({
    medicine_name: '',
    dosage: '',
    frequency: '',
    started_date: '',
    notes: '',
    reminder_time: ''
  });

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    description: '',
    prescription_date: '',
    doctor_name: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const medicinesRef = useRef(medicines);
  medicinesRef.current = medicines;

  useEffect(() => {
    checkUser();
    
    // Check for reminders every minute using ref to avoid re-fetching loop
    const reminderInterval = setInterval(checkReminders, 60000);
    return () => clearInterval(reminderInterval);
  }, []);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    
    medicinesRef.current.forEach(med => {
      if (med.is_active && med.reminder_time === currentTime) {
        toast({
          title: "Medication Reminder!",
          description: `Time to take your ${med.medicine_name} (${med.dosage || ''})`,
          duration: 10000,
        });
        
        // Use browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("RapidResq Medicine Reminder", {
            body: `It's time for your ${med.medicine_name}`,
            icon: "/pill-icon.png"
          });
        }
      }
    });
  };

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  };

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setUser(user);
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    try {
      const [medicinesRes, prescriptionsRes] = await Promise.all([
        supabase.from('user_medicines').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('uploaded_prescriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (medicinesRes.error) throw medicinesRes.error;
      if (prescriptionsRes.error) throw prescriptionsRes.error;

      setMedicines(medicinesRes.data || []);
      setPrescriptions(prescriptionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!medicineForm.medicine_name) {
      toast({
        title: "Missing Information",
        description: "Please enter the medicine name",
        variant: "destructive"
      });
      return;
    }

    setSavingMedicine(true);
    try {
      const { error } = await supabase
        .from('user_medicines')
        .insert({
          user_id: user.id,
          medicine_name: medicineForm.medicine_name,
          dosage: medicineForm.dosage || null,
          frequency: medicineForm.frequency || null,
          started_date: medicineForm.started_date || null,
          notes: medicineForm.notes || null,
          reminder_time: medicineForm.reminder_time || null
        });

      if (error) throw error;

      toast({
        title: "Medicine Added",
        description: "Your medicine has been saved successfully",
      });

      setMedicineDialogOpen(false);
      setMedicineForm({ medicine_name: '', dosage: '', frequency: '', started_date: '', notes: '', reminder_time: '' });
      fetchData(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingMedicine(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_medicines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData(user.id);
      toast({ title: "Medicine removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadPrescription = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a prescription image to upload",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('uploaded_prescriptions')
        .insert({
          user_id: user.id,
          file_name: selectedFile.name,
          file_url: publicUrl,
          description: prescriptionForm.description || null,
          prescription_date: prescriptionForm.prescription_date || null,
          doctor_name: prescriptionForm.doctor_name || null
        });

      if (dbError) throw dbError;

      toast({
        title: "Prescription Uploaded",
        description: "Your prescription has been saved successfully",
      });

      setPrescriptionDialogOpen(false);
      setSelectedFile(null);
      setPrescriptionForm({ description: '', prescription_date: '', doctor_name: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData(user.id);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePrescription = async (prescription: UploadedPrescription) => {
    try {
      // Extract file path from URL
      const urlParts = prescription.file_url.split('/');
      const filePath = `${user.id}/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage.from('prescriptions').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('uploaded_prescriptions')
        .delete()
        .eq('id', prescription.id);

      if (error) throw error;
      fetchData(user.id);
      toast({ title: "Prescription removed" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                My Medicines & Prescriptions
              </h1>
              <p className="text-muted-foreground">
                Keep track of your current medicines and upload prescriptions for easy access during consultations
              </p>
            </div>
            <div className="flex gap-2">
              {("Notification" in window && Notification.permission !== "granted") && (
                <Button variant="outline" size="sm" onClick={requestNotificationPermission} className="gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="medicines" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="medicines" className="gap-2">
                <Pill className="w-4 h-4" />
                Current Medicines ({medicines.filter(m => m.is_active).length})
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="gap-2">
                <FileImage className="w-4 h-4" />
                Uploaded Prescriptions ({prescriptions.length})
              </TabsTrigger>
            </TabsList>

            {/* Medicines Tab */}
            <TabsContent value="medicines" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={medicineDialogOpen} onOpenChange={setMedicineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Medicine
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Current Medicine</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Medicine Name *</Label>
                        <Input
                          placeholder="e.g., Metformin 500mg"
                          value={medicineForm.medicine_name}
                          onChange={(e) => setMedicineForm({ ...medicineForm, medicine_name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Dosage</Label>
                          <Input
                            placeholder="e.g., 1 tablet"
                            value={medicineForm.dosage}
                            onChange={(e) => setMedicineForm({ ...medicineForm, dosage: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select
                            value={medicineForm.frequency}
                            onValueChange={(value) => setMedicineForm({ ...medicineForm, frequency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Once daily">Once daily</SelectItem>
                              <SelectItem value="Twice daily">Twice daily</SelectItem>
                              <SelectItem value="Thrice daily">Thrice daily</SelectItem>
                              <SelectItem value="Before meals">Before meals</SelectItem>
                              <SelectItem value="After meals">After meals</SelectItem>
                              <SelectItem value="At bedtime">At bedtime</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Started Taking From</Label>
                        <Input
                          type="date"
                          value={medicineForm.started_date}
                          onChange={(e) => setMedicineForm({ ...medicineForm, started_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reminder Time</Label>
                        <Input 
                          type="time"
                          value={medicineForm.reminder_time}
                          onChange={(e) => setMedicineForm({...medicineForm, reminder_time: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">Set a time to get notified daily</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Any additional notes..."
                          value={medicineForm.notes}
                          onChange={(e) => setMedicineForm({ ...medicineForm, notes: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleAddMedicine} className="w-full" disabled={savingMedicine}>
                        {savingMedicine ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                          'Add Medicine'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {medicines.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Medicines Added</h3>
                    <p className="text-muted-foreground mb-6">
                      Add medicines you are currently taking for easy reference during consultations
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {medicines.map(med => (
                    <Card key={med.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Pill className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{med.medicine_name}</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {med.dosage && (
                                  <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                                )}
                                {med.frequency && (
                                  <Badge variant="secondary" className="text-xs">{med.frequency}</Badge>
                                )}
                              </div>
                              {med.started_date && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Since {format(new Date(med.started_date), 'MMM d, yyyy')}
                                </p>
                              )}
                              {med.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{med.notes}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMedicine(med.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Prescription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Prescription</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div 
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        {selectedFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-medium">{selectedFile.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                            <p className="font-medium">Click to upload</p>
                            <p className="text-sm text-muted-foreground">JPG, PNG or PDF (max 10MB)</p>
                          </>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="e.g., Blood pressure medication"
                          value={prescriptionForm.description}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prescription Date</Label>
                          <Input
                            type="date"
                            value={prescriptionForm.prescription_date}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, prescription_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Doctor Name</Label>
                          <Input
                            placeholder="Dr. Name"
                            value={prescriptionForm.doctor_name}
                            onChange={(e) => setPrescriptionForm({ ...prescriptionForm, doctor_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <Button onClick={handleUploadPrescription} className="w-full" disabled={uploading || !selectedFile}>
                        {uploading ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                        ) : (
                          'Upload Prescription'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {prescriptions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Prescriptions Uploaded</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload your prescription images for easy sharing with doctors during consultations
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prescriptions.map(prescription => (
                    <Card key={prescription.id} className="overflow-hidden">
                      <div className="aspect-[4/3] bg-muted relative group">
                        <img 
                          src={prescription.file_url} 
                          alt={prescription.file_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af">PDF</text></svg>';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(prescription.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm line-clamp-1">
                              {prescription.description || prescription.file_name}
                            </h4>
                            {prescription.doctor_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <User className="w-3 h-3" />
                                {prescription.doctor_name}
                              </p>
                            )}
                            {prescription.prescription_date && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(prescription.prescription_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeletePrescription(prescription)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Info Section */}
          <Card className="mt-8 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Why Add Your Medicines?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Doctors can review your current medications before the consultation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Avoid drug interactions with new prescriptions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Keep a digital record of your medication history
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default MyMedicines;