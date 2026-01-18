-- Criar tabela para armazenar subscriptions de push notification
-- Vinculada ao par (establishment_id + customer_phone) para isolamento

CREATE TABLE push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz DEFAULT now(),
  -- Chave única: mesmo telefone + estabelecimento = uma subscription
  UNIQUE(establishment_id, customer_phone),
  -- Constraint para garantir endpoint único por dispositivo
  UNIQUE(endpoint)
);

-- Habilitar RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para operações públicas (cliente pode se inscrever)
CREATE POLICY "Allow public insert push subscriptions" 
  ON push_subscriptions FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public select push subscriptions" 
  ON push_subscriptions FOR SELECT 
  USING (true);

CREATE POLICY "Allow public delete push subscriptions" 
  ON push_subscriptions FOR DELETE 
  USING (true);

-- Criar índice para buscas rápidas
CREATE INDEX idx_push_subscriptions_establishment_phone 
  ON push_subscriptions(establishment_id, customer_phone);