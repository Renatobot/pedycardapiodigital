-- =============================================
-- MIGRAÇÃO COMPLETA: Novas Funcionalidades
-- =============================================

-- 1. CENTRAL DE PAGAMENTOS - Adicionar colunas ao establishments
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS accept_pix boolean DEFAULT true;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS accept_cash boolean DEFAULT true;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS accept_credit boolean DEFAULT true;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS accept_debit boolean DEFAULT true;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS cash_change_available boolean DEFAULT true;

-- 2. TEMPLATES DE WHATSAPP
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  message text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their templates" ON whatsapp_templates
  FOR ALL USING (establishment_id IN (SELECT id FROM establishments WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all templates" ON whatsapp_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 3. CRM - Adicionar métricas aos clientes
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent numeric DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS order_count integer DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_order_at timestamptz;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birthday date;

-- 4. PROMOÇÕES AUTOMÁTICAS
CREATE TABLE IF NOT EXISTS automatic_promotions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('happy_hour', 'first_order', 'birthday', 'min_value', 'weekday')),
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  start_time time,
  end_time time,
  days_of_week integer[],
  min_order_value numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automatic_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their promotions" ON automatic_promotions
  FOR ALL USING (establishment_id IN (SELECT id FROM establishments WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all promotions" ON automatic_promotions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view active promotions" ON automatic_promotions
  FOR SELECT USING (is_active = true);

-- 5. TRIGGER PARA ATUALIZAR MÉTRICAS DO CLIENTE
CREATE OR REPLACE FUNCTION update_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    UPDATE customers SET 
      total_spent = COALESCE(total_spent, 0) + COALESCE(NEW.total, 0),
      order_count = COALESCE(order_count, 0) + 1,
      last_order_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_order_delivered ON orders;
CREATE TRIGGER on_order_delivered
AFTER UPDATE ON orders
FOR EACH ROW 
EXECUTE FUNCTION update_customer_metrics();

-- 6. VIEW PARA MÉTRICAS DE PEDIDOS (Analytics)
CREATE OR REPLACE VIEW order_metrics AS
SELECT 
  establishment_id,
  date_trunc('day', created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN COALESCE(total, 0) ELSE 0 END) as revenue,
  COUNT(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN 1 END) as completed_orders,
  AVG(CASE WHEN status NOT IN ('cancelled', 'rejected') THEN total END) as avg_ticket,
  COUNT(CASE WHEN delivery_type = 'delivery' THEN 1 END) as delivery_count,
  COUNT(CASE WHEN delivery_type = 'pickup' THEN 1 END) as pickup_count
FROM orders
GROUP BY establishment_id, date_trunc('day', created_at);

-- 7. TRIGGER PARA UPDATED_AT NAS PROMOÇÕES
CREATE TRIGGER update_automatic_promotions_updated_at
BEFORE UPDATE ON automatic_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();