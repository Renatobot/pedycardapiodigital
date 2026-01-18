-- ESTABLISHMENTS: Recriar políticas de admin como PERMISSIVE
DROP POLICY IF EXISTS "Admins can update any establishment" ON establishments;
DROP POLICY IF EXISTS "Admins can view all establishments" ON establishments;

CREATE POLICY "Admins can view all establishments"
  ON establishments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any establishment"
  ON establishments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- CATEGORIES: Políticas admin para gerenciar cardápio
CREATE POLICY "Admins can manage all categories"
  ON categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PRODUCTS: Políticas admin
CREATE POLICY "Admins can manage all products"
  ON products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PRODUCT_ADDITIONS: Políticas admin
CREATE POLICY "Admins can manage all product additions"
  ON product_additions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PRODUCT_OPTION_GROUPS: Políticas admin
CREATE POLICY "Admins can manage all product option groups"
  ON product_option_groups FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- PRODUCT_OPTIONS: Políticas admin
CREATE POLICY "Admins can manage all product options"
  ON product_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- BUSINESS_HOURS: Políticas admin
CREATE POLICY "Admins can manage all business hours"
  ON business_hours FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- DELIVERY_ZONES: Políticas admin
CREATE POLICY "Admins can manage all delivery zones"
  ON delivery_zones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- DISCOUNT_CODES: Políticas admin
CREATE POLICY "Admins can manage all discount codes"
  ON discount_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ORDERS: Políticas admin para visualizar pedidos
CREATE POLICY "Admins can manage all orders"
  ON orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));