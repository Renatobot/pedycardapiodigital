-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add delivery_fee to establishments
ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0;

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(establishment_id, code)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  reference_point TEXT,
  payment_method VARCHAR(20) NOT NULL,
  payment_details TEXT,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  discount_value NUMERIC(10,2) DEFAULT 0,
  discount_code VARCHAR(50),
  total NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'on-the-way', 'delivered', 'cancelled')),
  observations TEXT,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on discount_codes
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_codes
CREATE POLICY "Establishments can manage their discount codes" 
ON public.discount_codes 
FOR ALL 
USING (establishment_id IN (
  SELECT id FROM establishments WHERE user_id = auth.uid()
));

CREATE POLICY "Public can read active discount codes"
ON public.discount_codes
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Establishments can manage their orders" 
ON public.orders 
FOR ALL 
USING (establishment_id IN (
  SELECT id FROM establishments WHERE user_id = auth.uid()
));

CREATE POLICY "Public can insert orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at on orders
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update public_establishments view to include delivery_fee
DROP VIEW IF EXISTS public_establishments;
CREATE VIEW public_establishments WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  slug,
  logo_url,
  plan_status,
  plan_expires_at,
  trial_end_date,
  delivery_fee
FROM establishments;