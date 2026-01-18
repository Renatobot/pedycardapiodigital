-- Adicionar colunas de personalização de aparência na tabela establishments
ALTER TABLE public.establishments
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#4A9BD9',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#4CAF50',
  ADD COLUMN IF NOT EXISTS menu_theme text DEFAULT 'light';

-- Recriar a view public_establishments para incluir os novos campos
DROP VIEW IF EXISTS public_establishments;

CREATE VIEW public_establishments WITH (security_invoker = on) AS
SELECT 
  id,
  name,
  logo_url,
  slug,
  plan_status,
  trial_end_date,
  plan_expires_at,
  delivery_fee,
  free_delivery_min,
  min_order_value,
  accept_pickup,
  address_street,
  address_number,
  address_neighborhood,
  address_complement,
  city,
  show_address_on_menu,
  allow_orders_when_closed,
  scheduled_orders_message,
  primary_color,
  secondary_color,
  menu_theme
FROM establishments;