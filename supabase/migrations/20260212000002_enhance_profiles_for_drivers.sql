-- Add role, status, and location to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_location JSONB,
ADD COLUMN IF NOT EXISTS ambulance_number TEXT;

-- Add check constraint for role
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'driver', 'operator', 'doctor'));

COMMENT ON COLUMN public.profiles.role IS 'Role of the user: user, driver, operator, or doctor';
COMMENT ON COLUMN public.profiles.is_online IS 'Whether the driver is currently online and available';
COMMENT ON COLUMN public.profiles.current_location IS 'Real-time location of the driver';
COMMENT ON COLUMN public.profiles.ambulance_number IS 'Ambulance vehicle number for drivers';
