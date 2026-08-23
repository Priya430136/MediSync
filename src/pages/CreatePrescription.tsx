import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Plus, 
  Trash2, 
  User,
  Stethoscope,
  Pill,
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Home
} from 'lucide-react';

interface Medicine {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
}

const CreatePrescription = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([
    { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);

  useEffect(() => {
    checkAccess();
    fetchDoctors();
    
    // Pre-fill from URL params if coming from consultation
    const consultationPatientId = searchParams.get('patientId');
    const consultationPatientName = searchParams.get('patientName');
    if (consultationPatientId) setPatientId(consultationPatientId);
    if (consultationPatientName) setPatientName(consultationPatientName);
  }, [searchParams]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is operator, doctor, or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const hasAccess = profile?.role === 'doctor' || profile?.role === 'operator' || profile?.role === 'admin';
    if (!hasAccess) {
      toast({
        title: "Access Denied",
        description: "Only doctors/operators can create prescriptions",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    setIsOperator(true);
    setLoading(false);
  };

  const fetchDoctors = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('id, name, specialization')
      .eq('available', true);
    setDoctors(data || []);
  };

  const addMedicine = () => {
    setMedicines([...medicines, { medicine_name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async () => {
    // Validation
    if (!patientId || !patientName || !diagnosis) {
      toast({
        title: "Missing Information",
        description: "Please fill in patient details and diagnosis",
        variant: "destructive"
      });
      return;
    }

    const validMedicines = medicines.filter(m => m.medicine_name && m.dosage && m.frequency && m.duration);
    if (validMedicines.length === 0) {
      toast({
        title: "No Medicines Added",
        description: "Please add at least one medicine",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Create prescription
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          patient_name: patientName,
          patient_age: patientAge ? parseInt(patientAge) : null,
          doctor_id: doctorId || null,
          diagnosis,
          notes: notes || null
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Add medicines
      const medicinesToInsert = validMedicines.map(med => ({
        prescription_id: prescription.id,
        medicine_name: med.medicine_name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || null
      }));

      const { error: medicinesError } = await supabase
        .from('prescription_medicines')
        .insert(medicinesToInsert);

      if (medicinesError) throw medicinesError;

      toast({
        title: "Prescription Created",
        description: "The prescription has been saved and shared with the patient",
      });

      navigate('/operator-dashboard');
    } catch (error: any) {
      console.error('Error creating prescription:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
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

  if (!isOperator) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only doctors and operators can create prescriptions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
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
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Create Prescription
            </h1>
            <p className="text-muted-foreground">
              Generate a digital prescription for the patient
            </p>
          </div>

          <div className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient ID *</Label>
                    <Input
                      placeholder="Patient's user ID"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">UUID from the user's account</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Patient Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      placeholder="Patient age"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prescribing Doctor</Label>
                    <Select value={doctorId} onValueChange={setDoctorId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map(doc => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.name} - {doc.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  Diagnosis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Diagnosis *</Label>
                  <Textarea
                    placeholder="Enter the diagnosis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any additional notes for the patient..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medicines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-primary" />
                    Medicines
                  </span>
                  <Button variant="outline" size="sm" onClick={addMedicine}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Medicine
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {medicines.map((med, index) => (
                  <Card key={index} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-sm">Medicine #{index + 1}</span>
                        {medicines.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeMedicine(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Medicine Name *</Label>
                          <Input
                            placeholder="e.g., Paracetamol 500mg"
                            value={med.medicine_name}
                            onChange={(e) => updateMedicine(index, 'medicine_name', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Dosage *</Label>
                          <Input
                            placeholder="e.g., 1 tablet"
                            value={med.dosage}
                            onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Frequency *</Label>
                          <Select 
                            value={med.frequency} 
                            onValueChange={(value) => updateMedicine(index, 'frequency', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Once daily">Once daily</SelectItem>
                              <SelectItem value="Twice daily">Twice daily</SelectItem>
                              <SelectItem value="Thrice daily">Thrice daily</SelectItem>
                              <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                              <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                              <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                              <SelectItem value="Before meals">Before meals</SelectItem>
                              <SelectItem value="After meals">After meals</SelectItem>
                              <SelectItem value="At bedtime">At bedtime</SelectItem>
                              <SelectItem value="As needed">As needed (SOS)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Duration *</Label>
                          <Select 
                            value={med.duration} 
                            onValueChange={(value) => updateMedicine(index, 'duration', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3 days">3 days</SelectItem>
                              <SelectItem value="5 days">5 days</SelectItem>
                              <SelectItem value="7 days">7 days</SelectItem>
                              <SelectItem value="10 days">10 days</SelectItem>
                              <SelectItem value="14 days">14 days</SelectItem>
                              <SelectItem value="1 month">1 month</SelectItem>
                              <SelectItem value="2 months">2 months</SelectItem>
                              <SelectItem value="3 months">3 months</SelectItem>
                              <SelectItem value="As directed">As directed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        <Label className="text-xs">Special Instructions</Label>
                        <Input
                          placeholder="e.g., Take with food, Avoid alcohol"
                          value={med.instructions}
                          onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate('/operator-dashboard')}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Prescription
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePrescription;