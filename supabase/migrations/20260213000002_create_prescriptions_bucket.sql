-- Create the prescriptions bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prescriptions', 'prescriptions', false) 
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated users can upload prescriptions" ON storage.objects;
CREATE POLICY "Authenticated users can upload prescriptions" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'prescriptions' AND auth.uid() = owner);

-- Allow authenticated users to select their own files
DROP POLICY IF EXISTS "Users can read own prescriptions" ON storage.objects;
CREATE POLICY "Users can read own prescriptions" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'prescriptions' AND auth.uid() = owner);
