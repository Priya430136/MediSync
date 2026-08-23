-- Database Optimization & Integrity Hardening

-- 1. Fix missing foreign key on bookings
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add performance indexes for video consultations and prescriptions
CREATE INDEX IF NOT EXISTS idx_video_consultations_user_id ON public.video_consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_doctor_id ON public.video_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_status ON public.video_consultations(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);

-- 3. Add data validation constraints
-- Ensure phone numbers follow a basic format if present
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_phone_format 
CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$');

-- 4. Create a view for active emergencies (useful for Operator Dashboard)
CREATE OR REPLACE VIEW public.active_emergencies AS
SELECT 
    b.id,
    b.user_id,
    p.full_name as patient_name,
    p.phone as patient_phone,
    b.pickup_address,
    b.status,
    b.created_at,
    b.current_location
FROM public.bookings b
JOIN public.profiles p ON b.user_id = p.user_id
WHERE b.status IN ('pending', 'active')
ORDER BY b.created_at DESC;

-- 5. Grant permissions for the view
GRANT SELECT ON public.active_emergencies TO authenticated;

-- 6. Add comment for clarity
COMMENT ON VIEW public.active_emergencies IS 'Real-time view of all pending and active SOS requests';
