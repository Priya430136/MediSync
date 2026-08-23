-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES public.video_consultations(id) ON DELETE SET NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  diagnosis TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription medicines table
CREATE TABLE public.prescription_medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_medicines ENABLE ROW LEVEL SECURITY;

-- Prescriptions policies - patients can view their own
CREATE POLICY "Patients can view their own prescriptions"
ON public.prescriptions FOR SELECT
USING (auth.uid() = patient_id);

-- Operators/admins can create prescriptions (acting as doctors)
CREATE POLICY "Operators can create prescriptions"
ON public.prescriptions FOR INSERT
WITH CHECK (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators can view all prescriptions"
ON public.prescriptions FOR SELECT
USING (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators can update prescriptions"
ON public.prescriptions FOR UPDATE
USING (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'admin'));

-- Prescription medicines policies
CREATE POLICY "Patients can view their prescription medicines"
ON public.prescription_medicines FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.prescriptions 
    WHERE prescriptions.id = prescription_medicines.prescription_id 
    AND prescriptions.patient_id = auth.uid()
  )
);

CREATE POLICY "Operators can manage prescription medicines"
ON public.prescription_medicines FOR ALL
USING (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();