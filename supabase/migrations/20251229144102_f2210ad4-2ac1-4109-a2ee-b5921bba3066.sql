-- Create user_medicines table for patients to track their current medicines
CREATE TABLE public.user_medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  started_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create uploaded_prescriptions table for prescription images/files
CREATE TABLE public.uploaded_prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  prescription_date DATE,
  doctor_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_prescriptions ENABLE ROW LEVEL SECURITY;

-- User medicines policies
CREATE POLICY "Users can view their own medicines"
ON public.user_medicines FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own medicines"
ON public.user_medicines FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medicines"
ON public.user_medicines FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medicines"
ON public.user_medicines FOR DELETE
USING (auth.uid() = user_id);

-- Uploaded prescriptions policies
CREATE POLICY "Users can view their own uploaded prescriptions"
ON public.uploaded_prescriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own prescriptions"
ON public.uploaded_prescriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploaded prescriptions"
ON public.uploaded_prescriptions FOR DELETE
USING (auth.uid() = user_id);

-- Operators can view user medicines and prescriptions for consultations
CREATE POLICY "Operators can view all user medicines"
ON public.user_medicines FOR SELECT
USING (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Operators can view all uploaded prescriptions"
ON public.uploaded_prescriptions FOR SELECT
USING (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_medicines_updated_at
BEFORE UPDATE ON public.user_medicines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for prescription uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', true);

-- Storage policies for prescriptions bucket
CREATE POLICY "Users can upload their own prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own prescription files"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own prescription files"
ON storage.objects FOR DELETE
USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Prescription files are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions');