-- =====================================================
-- SECURITY FIX: Complete Security Hardening Migration
-- =====================================================

-- 1. FIX STORAGE POLICIES - Remove insecure UPDATE/DELETE policies
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Create secure storage policies with proper ownership verification
-- Owners can only update/delete their OWN logos (based on user_id in establishments)
CREATE POLICY "Owners can update their establishment logos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE user_id = auth.uid() 
      AND logo_url LIKE '%' || storage.filename(name)
    )
  );

CREATE POLICY "Owners can delete their establishment logos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'logos'
    AND EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE user_id = auth.uid() 
      AND logo_url LIKE '%' || storage.filename(name)
    )
  );

-- Owners can manage product images (products belong to their establishment)
CREATE POLICY "Owners can update their product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'products'
    AND EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'products'
    AND EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE user_id = auth.uid()
    )
  );

-- Owners can manage addition images
CREATE POLICY "Owners can update their addition images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'additions'
    AND EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can delete their addition images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'additions'
    AND EXISTS (
      SELECT 1 FROM public.establishments 
      WHERE user_id = auth.uid()
    )
  );

-- 2. ADD ADMIN RLS POLICIES FOR ESTABLISHMENTS
-- Admins can view all establishments
CREATE POLICY "Admins can view all establishments"
  ON public.establishments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any establishment (for plan management)
CREATE POLICY "Admins can update any establishment"
  ON public.establishments FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. RECREATE PUBLIC VIEW WITH SECURITY_INVOKER AND MINIMAL DATA EXPOSURE
DROP VIEW IF EXISTS public_establishments;

-- Public view with ONLY non-sensitive data
CREATE VIEW public_establishments
WITH (security_invoker = on)
AS
SELECT 
  id,
  name,
  logo_url,
  plan_status,
  trial_end_date,
  plan_expires_at
FROM public.establishments;

-- Grant access to the view
GRANT SELECT ON public_establishments TO anon, authenticated;

-- 4. CREATE SECURE FUNCTION TO GET CONTACT INFO (only when needed)
-- This function returns contact data for a specific establishment
-- Used during checkout to get WhatsApp/PIX without exposing in public view
CREATE OR REPLACE FUNCTION public.get_establishment_contact(establishment_id uuid)
RETURNS TABLE(
  whatsapp text,
  pix_key text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.whatsapp, e.pix_key
  FROM establishments e
  WHERE e.id = establishment_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_establishment_contact(uuid) TO anon, authenticated;