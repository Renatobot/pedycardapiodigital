-- Create customer_addresses table for multiple addresses per customer
CREATE TABLE public.customer_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  label TEXT DEFAULT 'Casa',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT,
  reference_point TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: public access (customer not using Supabase Auth)
CREATE POLICY "Customer addresses are public" ON public.customer_addresses
  FOR ALL USING (true) WITH CHECK (true);

-- Add customer_id to orders for history tracking
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);

-- Create index for faster lookups
CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses(customer_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);