-- Tabela para armazenar subscriptions de push do lojista
CREATE TABLE public.store_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Habilitar RLS
ALTER TABLE public.store_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Política: Lojista pode gerenciar suas próprias subscriptions
CREATE POLICY "Users can view their own store subscriptions"
  ON public.store_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own store subscriptions"
  ON public.store_push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own store subscriptions"
  ON public.store_push_subscriptions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Habilitar realtime para a tabela orders (se ainda não estiver)
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_push_subscriptions;