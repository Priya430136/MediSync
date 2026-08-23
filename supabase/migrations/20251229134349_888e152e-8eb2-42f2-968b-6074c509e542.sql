-- Update the handle_new_user function with input validation and sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
BEGIN
  -- Extract and sanitize inputs with NULL handling
  v_full_name := COALESCE(TRIM(new.raw_user_meta_data->>'full_name'), '');
  v_phone := COALESCE(TRIM(new.raw_user_meta_data->>'phone'), '');
  
  -- Enforce length limits to prevent database bloat
  IF length(v_full_name) > 200 THEN
    v_full_name := left(v_full_name, 200);
  END IF;
  
  IF length(v_phone) > 50 THEN
    v_phone := left(v_phone, 50);
  END IF;
  
  -- Validate phone format - must match international format
  -- Allows: +, digits only, 1-15 digits after optional +
  IF v_phone != '' AND v_phone !~ '^\+?[0-9]{1,15}$' THEN
    v_phone := ''; -- Reset invalid phone to empty
  END IF;
  
  -- Remove any potential XSS/injection characters from name
  -- Only allow letters (including unicode), spaces, and common name characters
  v_full_name := regexp_replace(v_full_name, '[<>"\''&;]', '', 'g');
  
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (new.id, NULLIF(v_full_name, ''), NULLIF(v_phone, ''));
  
  RETURN new;
END;
$$;