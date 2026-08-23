
-- Add reminder_time to user_medicines
ALTER TABLE public.user_medicines ADD COLUMN IF NOT EXISTS reminder_time TIME;

COMMENT ON COLUMN public.user_medicines.reminder_time IS 'Time of day to send medication reminder';
