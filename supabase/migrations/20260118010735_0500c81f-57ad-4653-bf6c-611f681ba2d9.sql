-- =============================================
-- FASE 1: Novas colunas e tabelas para PEDY
-- =============================================

-- 1.1 Tabela establishments - Adicionar colunas
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS free_delivery_min NUMERIC(10,2);
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS accept_pickup BOOLEAN DEFAULT false;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 7;

-- 1.2 Tabela products - Adicionar colunas
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'unidade';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_promotional BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promotional_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_quantity INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS subject_to_availability BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS allow_observations BOOLEAN DEFAULT true;

-- 1.3 Tabela delivery_zones - NOVA
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('paid', 'free')),
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on delivery_zones
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_zones
CREATE POLICY "Public can view delivery zones"
ON delivery_zones FOR SELECT
USING (true);

CREATE POLICY "Establishments can manage their delivery zones"
ON delivery_zones FOR ALL
USING (establishment_id IN (
  SELECT id FROM establishments WHERE user_id = auth.uid()
));

-- 1.4 Tabela saved_addresses - NOVA
CREATE TABLE IF NOT EXISTS saved_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp TEXT NOT NULL,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  neighborhood TEXT,
  reference_point TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on saved_addresses
ALTER TABLE saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_addresses (public access for customers)
CREATE POLICY "Public can view their own addresses"
ON saved_addresses FOR SELECT
USING (true);

CREATE POLICY "Public can insert addresses"
ON saved_addresses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update their own addresses"
ON saved_addresses FOR UPDATE
USING (true);

CREATE POLICY "Public can delete their own addresses"
ON saved_addresses FOR DELETE
USING (true);

-- 1.5 Tabela orders - Adicionar colunas
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'delivery';

-- Atualizar view public_establishments para incluir novos campos
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
  delivery_fee,
  min_order_value,
  free_delivery_min,
  accept_pickup,
  city
FROM establishments;