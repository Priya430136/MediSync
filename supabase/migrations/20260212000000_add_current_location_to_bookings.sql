
-- Add current_location to bookings for real-time tracking
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS current_location JSONB;

-- Add index for spatial performance if using PostGIS (but here it's just JSONB)
COMMENT ON COLUMN public.bookings.current_location IS 'Real-time location of the assigned ambulance';
