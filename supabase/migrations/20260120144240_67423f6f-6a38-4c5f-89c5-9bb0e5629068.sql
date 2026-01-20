-- Create establishment_referrals table to track referrals between establishments
CREATE TABLE public.establishment_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  referred_name TEXT,
  plan_type TEXT NOT NULL,
  plan_value NUMERIC NOT NULL,
  credit_status TEXT DEFAULT 'pending' CHECK (credit_status IN ('pending', 'applied', 'expired')),
  credit_applied_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- Add referral columns to establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS own_referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referral_credit NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS referred_by_establishment_id UUID REFERENCES public.establishments(id);

-- Enable RLS
ALTER TABLE public.establishment_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for establishment_referrals
CREATE POLICY "Establishments can view their own referrals"
ON public.establishment_referrals
FOR SELECT
USING (
  referrer_id IN (
    SELECT id FROM public.establishments WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all referrals"
ON public.establishment_referrals
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique referral code for establishment
CREATE OR REPLACE FUNCTION public.generate_establishment_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  random_suffix TEXT;
  new_code TEXT;
BEGIN
  -- Use slug or generate from name
  base_slug := COALESCE(
    NEW.slug,
    lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '', 'g'))
  );
  
  -- Generate random 4-character suffix
  random_suffix := substr(md5(random()::text), 1, 4);
  
  -- Combine for unique code
  new_code := substr(base_slug, 1, 20) || '-' || random_suffix;
  
  NEW.own_referral_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate referral code on insert
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.establishments
FOR EACH ROW
WHEN (NEW.own_referral_code IS NULL)
EXECUTE FUNCTION public.generate_establishment_referral_code();

-- Generate referral codes for existing establishments that don't have one
UPDATE public.establishments
SET own_referral_code = substr(COALESCE(slug, lower(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'))), 1, 20) || '-' || substr(md5(id::text), 1, 4)
WHERE own_referral_code IS NULL;

-- Function to get establishment by referral code (for public use)
CREATE OR REPLACE FUNCTION public.get_establishment_by_referral_code(code TEXT)
RETURNS TABLE(id UUID, name TEXT, plan_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.name, e.plan_status
  FROM establishments e
  WHERE e.own_referral_code = code
    AND e.plan_status IN ('active', 'trial')
    AND (e.plan_type = 'pro' OR e.plan_type = 'pro_plus' OR e.has_pro_plus = true);
END;
$$;