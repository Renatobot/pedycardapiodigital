-- Tabela de notificações para o Admin Master
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('new_registration', 'reseller_sale')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
  reseller_id UUID REFERENCES resellers(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- RLS: Apenas admins podem ver e gerenciar notificações
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications" ON public.admin_notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update notifications" ON public.admin_notifications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete notifications" ON public.admin_notifications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Função para notificar novos cadastros
CREATE OR REPLACE FUNCTION public.notify_new_registration()
RETURNS TRIGGER AS $$
DECLARE
  reseller_name TEXT;
BEGIN
  -- Se tiver revendedor, buscar nome
  IF NEW.reseller_id IS NOT NULL THEN
    SELECT name INTO reseller_name FROM resellers WHERE id = NEW.reseller_id;
  END IF;

  INSERT INTO public.admin_notifications (type, title, message, establishment_id, reseller_id, metadata)
  VALUES (
    'new_registration',
    CASE 
      WHEN NEW.reseller_id IS NOT NULL THEN '📣 Novo cadastro via revendedor!'
      ELSE '🆕 Novo cadastro direto!'
    END,
    CASE 
      WHEN NEW.reseller_id IS NOT NULL THEN 
        'O estabelecimento "' || NEW.name || '" se cadastrou via "' || COALESCE(reseller_name, 'Revendedor') || '".'
      ELSE 
        'O estabelecimento "' || NEW.name || '" se cadastrou no plano grátis.'
    END,
    NEW.id,
    NEW.reseller_id,
    jsonb_build_object(
      'establishment_name', NEW.name,
      'city', COALESCE(NEW.city, 'Não informada'),
      'referral_code', NEW.referral_code,
      'reseller_name', reseller_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para novos cadastros
CREATE TRIGGER on_new_establishment_registration
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_registration();

-- Função para notificar vendas de revendedor
CREATE OR REPLACE FUNCTION public.notify_reseller_sale()
RETURNS TRIGGER AS $$
DECLARE
  reseller_name TEXT;
BEGIN
  -- Buscar nome do revendedor
  SELECT name INTO reseller_name FROM resellers WHERE id = NEW.reseller_id;
  
  INSERT INTO public.admin_notifications (type, title, message, establishment_id, reseller_id, metadata)
  VALUES (
    'reseller_sale',
    '💰 Venda de revendedor!',
    'O revendedor "' || COALESCE(reseller_name, 'Desconhecido') || '" ativou o plano ' || NEW.plan_type || ' para "' || COALESCE(NEW.establishment_name, 'Estabelecimento') || '".',
    NEW.establishment_id,
    NEW.reseller_id,
    jsonb_build_object(
      'plan_type', NEW.plan_type,
      'plan_price', NEW.plan_price,
      'commission_value', NEW.commission_value,
      'reseller_name', reseller_name,
      'establishment_name', NEW.establishment_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para vendas de revendedor
CREATE TRIGGER on_reseller_activation
  AFTER INSERT ON public.reseller_activations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reseller_sale();

-- Índices para performance
CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);