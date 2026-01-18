-- Update public_establishments view to include all necessary fields
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
  show_address_on_menu,
  allow_orders_when_closed,
  scheduled_orders_message
FROM establishments;