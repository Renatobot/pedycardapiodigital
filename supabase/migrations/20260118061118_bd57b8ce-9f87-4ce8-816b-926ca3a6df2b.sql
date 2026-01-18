-- Add address columns to establishments table
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS show_address_on_menu boolean DEFAULT false;

-- Update public_establishments view to include address fields
DROP VIEW IF EXISTS public_establishments;
CREATE VIEW public_establishments WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  logo_url,
  slug,
  city,
  plan_status,
  plan_expires_at,
  trial_end_date,
  delivery_fee,
  free_delivery_min,
  min_order_value,
  accept_pickup,
  address_street,
  address_number,
  address_neighborhood,
  address_complement,
  show_address_on_menu
FROM establishments;