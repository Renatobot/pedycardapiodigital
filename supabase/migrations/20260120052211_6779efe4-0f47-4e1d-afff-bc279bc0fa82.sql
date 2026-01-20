-- Add 'reseller' to the app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'reseller' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE app_role ADD VALUE 'reseller';
  END IF;
END $$;

-- Create resellers table
CREATE TABLE IF NOT EXISTS public.resellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT,
  
  -- Access type
  access_type TEXT NOT NULL DEFAULT 'own_only', -- 'all' or 'own_only'
  is_master BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Operation mode
  pricing_mode TEXT NOT NULL DEFAULT 'commission', -- 'custom_price' or 'commission'
  
  -- Custom prices (for custom_price mode)
  price_basic NUMERIC NOT NULL DEFAULT 37,
  price_pro NUMERIC NOT NULL DEFAULT 59.90,
  price_pro_plus NUMERIC NOT NULL DEFAULT 79.90,
  
  -- Commission (for commission mode)
  commission_percentage NUMERIC NOT NULL DEFAULT 10,
  
  -- Referral link
  referral_code TEXT UNIQUE NOT NULL,
  
  -- Statistics
  total_establishments INTEGER DEFAULT 0,
  active_establishments INTEGER DEFAULT 0,
  total_activations INTEGER DEFAULT 0,
  
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id),
  UNIQUE(email),
  CONSTRAINT price_basic_minimum CHECK (price_basic >= 37),
  CONSTRAINT price_pro_minimum CHECK (price_pro >= 59.90),
  CONSTRAINT price_pro_plus_minimum CHECK (price_pro_plus >= 79.90),
  CONSTRAINT commission_range CHECK (commission_percentage >= 0 AND commission_percentage <= 50)
);

-- Create reseller_activations table (commission tracking)
CREATE TABLE IF NOT EXISTS public.reseller_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID REFERENCES public.resellers(id) ON DELETE CASCADE NOT NULL,
  establishment_id UUID NOT NULL,
  establishment_name TEXT,
  
  -- Activation details
  plan_type TEXT NOT NULL, -- 'basic', 'pro', 'pro_plus'
  plan_price NUMERIC NOT NULL,
  days_activated INTEGER NOT NULL,
  
  -- Commission calculation
  commission_percentage NUMERIC NOT NULL DEFAULT 0,
  commission_value NUMERIC NOT NULL DEFAULT 0,
  
  -- Payment status
  commission_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  commission_paid_at TIMESTAMP WITH TIME ZONE,
  
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add columns to establishments table
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS reseller_id UUID REFERENCES public.resellers(id),
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS activated_by_reseller BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_activations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resellers table
CREATE POLICY "Admins can view all resellers" ON public.resellers
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert resellers" ON public.resellers
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update resellers" ON public.resellers
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete resellers" ON public.resellers
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Resellers can view own data" ON public.resellers
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for reseller_activations table
CREATE POLICY "Admins can view all activations" ON public.reseller_activations
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage activations" ON public.reseller_activations
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Resellers can view own activations" ON public.reseller_activations
FOR SELECT TO authenticated
USING (reseller_id IN (SELECT id FROM public.resellers WHERE user_id = auth.uid()));

-- Function to get reseller by referral code (public access for registration)
CREATE OR REPLACE FUNCTION public.get_reseller_by_code(code TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  pricing_mode TEXT,
  price_basic NUMERIC,
  price_pro NUMERIC,
  price_pro_plus NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT r.id, r.name, r.pricing_mode, r.price_basic, r.price_pro, r.price_pro_plus
  FROM resellers r
  WHERE r.referral_code = code AND r.is_active = TRUE;
END;
$$;

-- Function to update reseller statistics
CREATE OR REPLACE FUNCTION public.update_reseller_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reseller_id IS NOT NULL THEN
    UPDATE resellers 
    SET total_establishments = total_establishments + 1,
        last_activity_at = now(),
        updated_at = now()
    WHERE id = NEW.reseller_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for reseller stats
DROP TRIGGER IF EXISTS update_reseller_stats_trigger ON establishments;
CREATE TRIGGER update_reseller_stats_trigger
AFTER INSERT ON establishments
FOR EACH ROW
EXECUTE FUNCTION update_reseller_stats();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_establishments_reseller_id ON establishments(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_activations_reseller_id ON reseller_activations(reseller_id);
CREATE INDEX IF NOT EXISTS idx_resellers_referral_code ON resellers(referral_code);