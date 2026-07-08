
-- ============================================
-- 1. Recreate views with security_invoker=on
-- ============================================
DROP VIEW IF EXISTS public.order_metrics;
CREATE VIEW public.order_metrics
WITH (security_invoker=on) AS
SELECT establishment_id,
    date_trunc('day', created_at) AS order_date,
    count(*) AS total_orders,
    sum(CASE WHEN status::text <> ALL (ARRAY['cancelled','rejected']) THEN COALESCE(total,0) ELSE 0 END) AS revenue,
    count(CASE WHEN status::text <> ALL (ARRAY['cancelled','rejected']) THEN 1 END) AS completed_orders,
    avg(CASE WHEN status::text <> ALL (ARRAY['cancelled','rejected']) THEN total END) AS avg_ticket,
    count(CASE WHEN delivery_type='delivery' THEN 1 END) AS delivery_count,
    count(CASE WHEN delivery_type='pickup' THEN 1 END) AS pickup_count
FROM public.orders
GROUP BY establishment_id, date_trunc('day', created_at);

REVOKE ALL ON public.order_metrics FROM anon, authenticated;
GRANT SELECT ON public.order_metrics TO authenticated;
GRANT ALL ON public.order_metrics TO service_role;

DROP VIEW IF EXISTS public.public_establishments;
CREATE VIEW public.public_establishments
WITH (security_invoker=on) AS
SELECT id, name, logo_url, slug, plan_status, trial_end_date, plan_expires_at,
    delivery_fee, free_delivery_min, min_order_value, accept_pickup,
    address_street, address_number, address_neighborhood, address_complement,
    city, show_address_on_menu, allow_orders_when_closed, scheduled_orders_message,
    primary_color, secondary_color, menu_theme
FROM public.establishments;

GRANT SELECT ON public.public_establishments TO anon, authenticated;
GRANT ALL ON public.public_establishments TO service_role;

DROP VIEW IF EXISTS public.reseller_establishments_view;
CREATE VIEW public.reseller_establishments_view
WITH (security_invoker=on) AS
SELECT id, name, whatsapp, plan_status, plan_type, plan_expires_at,
    trial_end_date, created_at, reseller_id, activated_by_reseller
FROM public.establishments e
WHERE reseller_id IS NOT NULL;

GRANT SELECT ON public.reseller_establishments_view TO authenticated;
GRANT ALL ON public.reseller_establishments_view TO service_role;

-- ============================================
-- 2. email_verifications: add explicit deny policy
-- ============================================
CREATE POLICY "Deny all client access to email verifications"
ON public.email_verifications
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ============================================
-- 3. Drop permissive policies on customer tables
-- ============================================
DROP POLICY IF EXISTS "Customers public read" ON public.customers;
DROP POLICY IF EXISTS "Customers public insert" ON public.customers;
DROP POLICY IF EXISTS "Customers public update" ON public.customers;

DROP POLICY IF EXISTS "Public can view their own addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Public can insert addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Public can update their own addresses" ON public.saved_addresses;
DROP POLICY IF EXISTS "Public can delete their own addresses" ON public.saved_addresses;

DROP POLICY IF EXISTS "Customer addresses are public" ON public.customer_addresses;

DROP POLICY IF EXISTS "Favorites public read" ON public.customer_favorites;
DROP POLICY IF EXISTS "Favorites public insert" ON public.customer_favorites;
DROP POLICY IF EXISTS "Favorites public delete" ON public.customer_favorites;

-- No public policies means: only service_role (edge functions / SECURITY DEFINER RPCs) can access

-- Establishment owners can still read their own customers (via joined orders) - keep authenticated access via existing policies if any
-- Add: authenticated establishment owner can view customers that ordered from them
CREATE POLICY "Establishment owners view their customers via orders"
ON public.customers
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  JOIN public.establishments e ON e.id = o.establishment_id
  WHERE o.customer_id = customers.id AND e.user_id = auth.uid()
));

-- ============================================
-- 4. SECURITY DEFINER RPC functions for anonymous customer operations
-- ============================================

-- Customer login by phone
CREATE OR REPLACE FUNCTION public.customer_login(_whatsapp text)
RETURNS TABLE(id uuid, whatsapp text, name text, street text, number text, complement text, neighborhood text, reference_point text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF length(norm) < 10 THEN RETURN; END IF;
  RETURN QUERY SELECT c.id, c.whatsapp, c.name, c.street, c.number, c.complement, c.neighborhood, c.reference_point
  FROM public.customers c WHERE c.whatsapp = norm LIMIT 1;
END;$$;

CREATE OR REPLACE FUNCTION public.customer_register(
  _whatsapp text, _name text, _street text DEFAULT NULL, _number text DEFAULT NULL,
  _complement text DEFAULT NULL, _neighborhood text DEFAULT NULL, _reference_point text DEFAULT NULL
) RETURNS TABLE(id uuid, whatsapp text, name text, street text, number text, complement text, neighborhood text, reference_point text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
  new_id uuid;
BEGIN
  IF length(norm) < 10 OR COALESCE(trim(_name),'') = '' THEN
    RAISE EXCEPTION 'Dados inválidos' USING ERRCODE='22023';
  END IF;
  INSERT INTO public.customers (whatsapp, name, street, number, complement, neighborhood, reference_point)
  VALUES (norm, trim(_name), _street, _number, _complement, _neighborhood, _reference_point)
  RETURNING customers.id INTO new_id;
  RETURN QUERY SELECT c.id, c.whatsapp, c.name, c.street, c.number, c.complement, c.neighborhood, c.reference_point
  FROM public.customers c WHERE c.id = new_id;
END;$$;

CREATE OR REPLACE FUNCTION public.customer_update(
  _id uuid, _whatsapp text, _name text DEFAULT NULL, _street text DEFAULT NULL,
  _number text DEFAULT NULL, _complement text DEFAULT NULL, _neighborhood text DEFAULT NULL, _reference_point text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  -- Require phone to match record as a light ownership check
  UPDATE public.customers SET
    name = COALESCE(_name, name),
    street = COALESCE(_street, street),
    number = COALESCE(_number, number),
    complement = COALESCE(_complement, complement),
    neighborhood = COALESCE(_neighborhood, neighborhood),
    reference_point = COALESCE(_reference_point, reference_point),
    updated_at = now()
  WHERE id = _id AND whatsapp = norm;
  RETURN FOUND;
END;$$;

-- customer_addresses RPCs (require whatsapp match)
CREATE OR REPLACE FUNCTION public.get_customer_addresses(_customer_id uuid, _whatsapp text)
RETURNS SETOF public.customer_addresses
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public STABLE AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM public.customer_addresses WHERE customer_id = _customer_id
    ORDER BY is_default DESC NULLS LAST, created_at DESC;
END;$$;

CREATE OR REPLACE FUNCTION public.add_customer_address(
  _customer_id uuid, _whatsapp text, _label text, _street text, _number text,
  _complement text DEFAULT NULL, _neighborhood text DEFAULT NULL,
  _reference_point text DEFAULT NULL, _is_default boolean DEFAULT false
) RETURNS public.customer_addresses
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
  new_row public.customer_addresses;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE='42501';
  END IF;
  IF _is_default THEN
    UPDATE public.customer_addresses SET is_default = false WHERE customer_id = _customer_id;
  END IF;
  INSERT INTO public.customer_addresses (customer_id, label, street, number, complement, neighborhood, reference_point, is_default)
  VALUES (_customer_id, _label, _street, _number, _complement, _neighborhood, _reference_point, _is_default)
  RETURNING * INTO new_row;
  RETURN new_row;
END;$$;

CREATE OR REPLACE FUNCTION public.update_customer_address(
  _address_id uuid, _customer_id uuid, _whatsapp text,
  _label text DEFAULT NULL, _street text DEFAULT NULL, _number text DEFAULT NULL,
  _complement text DEFAULT NULL, _neighborhood text DEFAULT NULL,
  _reference_point text DEFAULT NULL, _is_default boolean DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE='42501';
  END IF;
  IF _is_default = true THEN
    UPDATE public.customer_addresses SET is_default = false WHERE customer_id = _customer_id;
  END IF;
  UPDATE public.customer_addresses SET
    label = COALESCE(_label, label),
    street = COALESCE(_street, street),
    number = COALESCE(_number, number),
    complement = COALESCE(_complement, complement),
    neighborhood = COALESCE(_neighborhood, neighborhood),
    reference_point = COALESCE(_reference_point, reference_point),
    is_default = COALESCE(_is_default, is_default)
  WHERE id = _address_id AND customer_id = _customer_id;
  RETURN FOUND;
END;$$;

CREATE OR REPLACE FUNCTION public.delete_customer_address(_address_id uuid, _customer_id uuid, _whatsapp text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE='42501';
  END IF;
  DELETE FROM public.customer_addresses WHERE id = _address_id AND customer_id = _customer_id;
  RETURN FOUND;
END;$$;

-- saved_addresses RPCs (require whatsapp + establishment_id)
CREATE OR REPLACE FUNCTION public.get_saved_addresses(_whatsapp text, _establishment_id uuid)
RETURNS SETOF public.saved_addresses
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public STABLE AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF length(norm) < 10 OR _establishment_id IS NULL THEN RETURN; END IF;
  RETURN QUERY SELECT * FROM public.saved_addresses
    WHERE whatsapp = norm AND establishment_id = _establishment_id
    ORDER BY created_at DESC LIMIT 3;
END;$$;

CREATE OR REPLACE FUNCTION public.save_customer_address(
  _whatsapp text, _establishment_id uuid, _address text,
  _street text DEFAULT NULL, _number text DEFAULT NULL, _complement text DEFAULT NULL,
  _neighborhood text DEFAULT NULL, _reference_point text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
  existing_count int;
  oldest_id uuid;
  new_id uuid;
BEGIN
  IF length(norm) < 10 OR _establishment_id IS NULL THEN
    RAISE EXCEPTION 'Dados inválidos' USING ERRCODE='22023';
  END IF;
  SELECT count(*) INTO existing_count FROM public.saved_addresses
    WHERE whatsapp = norm AND establishment_id = _establishment_id;
  IF existing_count >= 3 THEN
    SELECT id INTO oldest_id FROM public.saved_addresses
      WHERE whatsapp = norm AND establishment_id = _establishment_id
      ORDER BY created_at ASC LIMIT 1;
    DELETE FROM public.saved_addresses WHERE id = oldest_id;
  END IF;
  INSERT INTO public.saved_addresses (whatsapp, establishment_id, address, street, number, complement, neighborhood, reference_point)
  VALUES (norm, _establishment_id, _address, _street, _number, _complement, _neighborhood, _reference_point)
  RETURNING id INTO new_id;
  RETURN new_id;
END;$$;

-- customer_favorites RPCs
CREATE OR REPLACE FUNCTION public.get_customer_favorites(_customer_id uuid, _whatsapp text, _establishment_id uuid)
RETURNS TABLE(product_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public STABLE AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN RETURN; END IF;
  RETURN QUERY SELECT cf.product_id FROM public.customer_favorites cf
    WHERE cf.customer_id = _customer_id AND cf.establishment_id = _establishment_id;
END;$$;

CREATE OR REPLACE FUNCTION public.toggle_customer_favorite(
  _customer_id uuid, _whatsapp text, _establishment_id uuid, _product_id uuid, _add boolean
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE='42501';
  END IF;
  IF _add THEN
    INSERT INTO public.customer_favorites (customer_id, establishment_id, product_id)
    VALUES (_customer_id, _establishment_id, _product_id)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.customer_favorites
    WHERE customer_id = _customer_id AND product_id = _product_id;
  END IF;
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION public.clear_customer_favorites(_customer_id uuid, _whatsapp text, _establishment_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE='42501';
  END IF;
  DELETE FROM public.customer_favorites
    WHERE customer_id = _customer_id AND establishment_id = _establishment_id;
  RETURN true;
END;$$;

CREATE OR REPLACE FUNCTION public.migrate_customer_favorites(
  _customer_id uuid, _whatsapp text, _establishment_id uuid, _product_ids uuid[]
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  norm text := regexp_replace(COALESCE(_whatsapp,''), '[^0-9]', '', 'g');
  pid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer_id AND whatsapp = norm) THEN
    RAISE EXCEPTION 'Não autorizado' USING ERRCODE='42501';
  END IF;
  FOREACH pid IN ARRAY _product_ids LOOP
    INSERT INTO public.customer_favorites (customer_id, establishment_id, product_id)
    VALUES (_customer_id, _establishment_id, pid)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RETURN true;
END;$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.customer_login(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_register(text,text,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_update(uuid,text,text,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_addresses(uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_customer_address(uuid,text,text,text,text,text,text,text,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_customer_address(uuid,uuid,text,text,text,text,text,text,text,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_customer_address(uuid,uuid,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_saved_addresses(text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_customer_address(text,uuid,text,text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_favorites(uuid,text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_customer_favorite(uuid,text,uuid,uuid,boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.clear_customer_favorites(uuid,text,uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_customer_favorites(uuid,text,uuid,uuid[]) TO anon, authenticated;
