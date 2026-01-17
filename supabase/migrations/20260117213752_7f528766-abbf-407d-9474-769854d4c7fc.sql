-- Drop and recreate public_establishments view with date fields for plan verification
DROP VIEW IF EXISTS public_establishments;

CREATE VIEW public_establishments AS
SELECT 
  id,
  name,
  logo_url,
  whatsapp,
  pix_key,
  plan_status,
  trial_end_date,
  plan_expires_at
FROM establishments;