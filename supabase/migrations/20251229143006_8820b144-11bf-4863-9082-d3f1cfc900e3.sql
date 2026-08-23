-- Create doctors table for video consultations
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience_years INTEGER NOT NULL DEFAULT 0,
  consultation_fee INTEGER NOT NULL DEFAULT 199,
  rating NUMERIC(2,1) DEFAULT 4.5,
  available BOOLEAN DEFAULT true,
  languages TEXT[] DEFAULT ARRAY['English', 'Hindi'],
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video consultations booking table
CREATE TABLE public.video_consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'in_progress')),
  notes TEXT,
  amount INTEGER NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health cards table
CREATE TABLE public.health_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('abha', 'insurance', 'employee', 'government')),
  card_number TEXT NOT NULL,
  card_name TEXT NOT NULL,
  provider_name TEXT,
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_cards ENABLE ROW LEVEL SECURITY;

-- Doctors table policies (public read, admin write)
CREATE POLICY "Anyone can view available doctors"
ON public.doctors FOR SELECT
USING (available = true);

-- Video consultations policies
CREATE POLICY "Users can view their own consultations"
ON public.video_consultations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consultations"
ON public.video_consultations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultations"
ON public.video_consultations FOR UPDATE
USING (auth.uid() = user_id);

-- Health cards policies
CREATE POLICY "Users can view their own health cards"
ON public.health_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health cards"
ON public.health_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health cards"
ON public.health_cards FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health cards"
ON public.health_cards FOR DELETE
USING (auth.uid() = user_id);

-- Insert sample doctors with affordable Indian pricing
INSERT INTO public.doctors (name, specialization, experience_years, consultation_fee, rating, languages, avatar_url) VALUES
('Dr. Priya Sharma', 'General Physician', 8, 149, 4.8, ARRAY['English', 'Hindi', 'Marathi'], NULL),
('Dr. Rajesh Kumar', 'Cardiologist', 15, 299, 4.9, ARRAY['English', 'Hindi'], NULL),
('Dr. Anita Desai', 'Dermatologist', 10, 199, 4.7, ARRAY['English', 'Hindi', 'Gujarati'], NULL),
('Dr. Vikram Singh', 'Orthopedic', 12, 249, 4.6, ARRAY['English', 'Hindi', 'Punjabi'], NULL),
('Dr. Meera Patel', 'Gynecologist', 9, 199, 4.8, ARRAY['English', 'Hindi', 'Gujarati'], NULL),
('Dr. Suresh Reddy', 'Pediatrician', 7, 149, 4.7, ARRAY['English', 'Hindi', 'Telugu'], NULL),
('Dr. Kavita Nair', 'ENT Specialist', 6, 179, 4.5, ARRAY['English', 'Hindi', 'Malayalam'], NULL),
('Dr. Amit Joshi', 'Psychiatrist', 11, 349, 4.9, ARRAY['English', 'Hindi'], NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_video_consultations_updated_at
BEFORE UPDATE ON public.video_consultations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_cards_updated_at
BEFORE UPDATE ON public.health_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();