-- Add Pro+ columns to establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS has_pro_plus boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pro_plus_activated_at timestamp with time zone;

-- Add multi-flavor columns to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS enable_multi_flavor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_flavors integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS flavor_price_rule text DEFAULT 'highest';

-- Create product_option_groups table
CREATE TABLE public.product_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'single',
  is_required boolean DEFAULT false,
  min_selections integer DEFAULT 0,
  max_selections integer DEFAULT 1,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create product_options table
CREATE TABLE public.product_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric DEFAULT 0,
  is_default boolean DEFAULT false,
  is_available boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_option_groups
CREATE POLICY "Public can view option groups" ON public.product_option_groups
FOR SELECT USING (true);

CREATE POLICY "Establishments can manage their option groups" ON public.product_option_groups
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.establishments e ON p.establishment_id = e.id
    WHERE p.id = product_option_groups.product_id
    AND e.user_id = auth.uid()
  )
);

-- RLS policies for product_options
CREATE POLICY "Public can view options" ON public.product_options
FOR SELECT USING (true);

CREATE POLICY "Establishments can manage their options" ON public.product_options
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.product_option_groups og
    JOIN public.products p ON og.product_id = p.id
    JOIN public.establishments e ON p.establishment_id = e.id
    WHERE og.id = product_options.option_group_id
    AND e.user_id = auth.uid()
  )
);

-- Update public_establishments view to include has_pro_plus
DROP VIEW IF EXISTS public.public_establishments;
CREATE VIEW public.public_establishments WITH (security_invoker = on) AS
SELECT 
  id, name, logo_url, slug, city,
  plan_status, trial_end_date, plan_expires_at,
  delivery_fee, min_order_value, free_delivery_min, accept_pickup,
  allow_orders_when_closed, scheduled_orders_message,
  has_pro_plus
FROM public.establishments;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_option_groups_product_id ON public.product_option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_product_options_group_id ON public.product_options(option_group_id);