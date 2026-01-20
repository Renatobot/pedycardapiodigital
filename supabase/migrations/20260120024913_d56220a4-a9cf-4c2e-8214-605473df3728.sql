-- Adicionar colunas para rastrear status de cadastro do cliente no pedido
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_registered_customer BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS customer_order_count INTEGER DEFAULT 0;