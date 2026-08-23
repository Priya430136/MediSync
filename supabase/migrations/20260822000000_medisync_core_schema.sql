-- MediSync Core Clinical & Scheduling Schema Migration
-- Extends the existing database models with complete schema for doctors, appointments,
-- leaves, slot holds, AI pre/post visit records, medication schedules & reminders,
-- and strict database-level concurrency & double-booking prevention.

-- 1. Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Extend / Update Roles Constraint in profiles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('patient', 'doctor', 'admin', 'operator', 'hospital', 'driver', 'user'));

-- 3. Extend doctors table with working hours, slot duration, specialisation and clinical profiles
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS qualifications TEXT DEFAULT 'MD',
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
ADD COLUMN IF NOT EXISTS break_hours JSONB DEFAULT '{"start": "13:00", "end": "14:00"}'::jsonb,
ADD COLUMN IF NOT EXISTS slot_duration_minutes INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
ADD COLUMN IF NOT EXISTS leave_dates TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hospital_affiliation TEXT DEFAULT 'MediSync Medical Center',
ADD COLUMN IF NOT EXISTS room_number TEXT DEFAULT 'Consultation Suite 101',
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. Patients table (Dedicated clinical record profile)
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    age INTEGER,
    gender TEXT,
    blood_group TEXT,
    emergency_contact TEXT,
    medical_history TEXT,
    allergies TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON public.patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);

-- 5. Doctor Leave Management Table
CREATE TABLE IF NOT EXISTS public.doctor_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id TEXT NOT NULL, -- Supports both UUID and mock/text doctor IDs
    leave_date DATE NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_doctor_leave_date UNIQUE (doctor_id, leave_date)
);

CREATE INDEX IF NOT EXISTS idx_doctor_leaves_doc_date ON public.doctor_leaves(doctor_id, leave_date);

-- 6. Slot Holds Table (Atomic TTL Locks for Live Slot Reservation)
CREATE TABLE IF NOT EXISTS public.slot_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id TEXT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    hold_token TEXT UNIQUE NOT NULL,
    patient_name TEXT,
    patient_email TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_slot_holds_doctor_slot ON public.slot_holds(doctor_id, slot_date, start_time);
CREATE INDEX IF NOT EXISTS idx_slot_holds_expires_at ON public.slot_holds(expires_at);

-- 7. Appointments Table (Core Appointment Engine)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT UNIQUE NOT NULL,
    doctor_id TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    doctor_specialisation TEXT NOT NULL,
    patient_id TEXT,
    patient_name TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    patient_phone TEXT,
    patient_age INTEGER,
    patient_gender TEXT,
    appointment_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduling_required', 'no_show')),
    cancellation_reason TEXT,
    
    -- Pre-visit clinical data
    symptoms TEXT NOT NULL,
    symptom_duration TEXT,
    medical_history TEXT,
    allergies TEXT,
    pre_visit_ai_summary JSONB,
    
    -- Post-visit clinical notes & vitals
    diagnosis TEXT,
    clinical_notes TEXT,
    vitals JSONB,
    post_visit_ai_summary JSONB,
    
    -- Integrations & Calendar
    google_calendar_event_id TEXT,
    google_calendar_link TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================================================
-- CRITICAL DATABASE-LEVEL DOUBLE-BOOKING PREVENTION
-- Partial Unique Index ensures a doctor CANNOT have two confirmed appointments
-- for the exact same date and start_time under simultaneous concurrent load.
-- ===========================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_uq_doctor_confirmed_slot 
ON public.appointments (doctor_id, appointment_date, start_time) 
WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_email ON public.appointments(patient_email);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_ref ON public.appointments(booking_reference);

-- 8. Prescription Medicines / Medication Schedule Table
CREATE TABLE IF NOT EXISTS public.prescription_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id TEXT,
    prescription_id UUID,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    timing TEXT NOT NULL CHECK (timing IN ('Before Meals', 'After Meals', 'With Meals', 'As Needed', 'Bedtime')),
    duration_days INTEGER DEFAULT 5,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prescription_schedules_apt ON public.prescription_schedules(appointment_id);

-- 9. Medication Reminders Table
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_email TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time_slot TEXT NOT NULL CHECK (time_slot IN ('Morning (08:00)', 'Afternoon (13:00)', 'Evening (18:00)', 'Night (21:00)')),
    scheduled_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'taken', 'skipped')),
    reminder_date DATE NOT NULL,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medication_reminders_patient ON public.medication_reminders(patient_email, reminder_date);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_status ON public.medication_reminders(status);

-- 10. Notification Queue & Retry Engine Table
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_role TEXT NOT NULL CHECK (recipient_role IN ('patient', 'doctor', 'admin', 'operator', 'user')),
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'BOOKING_CONFIRMATION',
        'APPOINTMENT_REMINDER',
        'APPOINTMENT_CANCELLED',
        'DOCTOR_LEAVE_ALERT',
        'POST_VISIT_SUMMARY_READY',
        'MEDICATION_REMINDER'
    )),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    google_calendar_event_id TEXT,
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON public.notification_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON public.notification_logs(notification_type);

-- 11. Enable Row Level Security (RLS) on newly created tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies
DROP POLICY IF EXISTS "Public read for doctor leaves" ON public.doctor_leaves;
CREATE POLICY "Public read for doctor leaves" ON public.doctor_leaves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read and hold for slots" ON public.slot_holds;
CREATE POLICY "Public read and hold for slots" ON public.slot_holds FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all users to view and insert appointments" ON public.appointments;
CREATE POLICY "Allow all users to view and insert appointments" ON public.appointments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow access to reminders" ON public.medication_reminders;
CREATE POLICY "Allow access to reminders" ON public.medication_reminders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow access to notification logs" ON public.notification_logs;
CREATE POLICY "Allow access to notification logs" ON public.notification_logs FOR ALL USING (true);
