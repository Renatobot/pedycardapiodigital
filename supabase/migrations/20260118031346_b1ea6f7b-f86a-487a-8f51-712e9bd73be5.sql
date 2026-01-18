-- Tabela de horários de funcionamento
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open boolean NOT NULL DEFAULT true,
  opening_time time,
  closing_time time,
  created_at timestamptz DEFAULT now(),
  UNIQUE(establishment_id, day_of_week)
);

-- Configurações de pedidos fora do horário
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS allow_orders_when_closed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_orders_message text;

-- Habilitar RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para business_hours
CREATE POLICY "Public can view business hours"
ON public.business_hours FOR SELECT
USING (true);

CREATE POLICY "Users can insert their business hours"
ON public.business_hours FOR INSERT TO authenticated
WITH CHECK (establishment_id IN (
  SELECT id FROM public.establishments WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their business hours"
ON public.business_hours FOR UPDATE TO authenticated
USING (establishment_id IN (
  SELECT id FROM public.establishments WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their business hours"
ON public.business_hours FOR DELETE TO authenticated
USING (establishment_id IN (
  SELECT id FROM public.establishments WHERE user_id = auth.uid()
));

-- Atualizar view pública para incluir novas colunas
DROP VIEW IF EXISTS public.public_establishments;
CREATE VIEW public.public_establishments WITH (security_invoker = on) AS
SELECT 
  id, name, logo_url, slug, city,
  plan_status, trial_end_date, plan_expires_at,
  delivery_fee, min_order_value, free_delivery_min, accept_pickup,
  allow_orders_when_closed, scheduled_orders_message
FROM public.establishments;