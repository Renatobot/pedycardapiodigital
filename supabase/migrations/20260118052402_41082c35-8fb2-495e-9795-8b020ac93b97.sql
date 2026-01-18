-- Add column to enable/disable customer notifications on status change
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS notify_customer_on_status_change boolean DEFAULT true;

COMMENT ON COLUMN public.establishments.notify_customer_on_status_change 
IS 'Habilita/desabilita notificação automática ao cliente quando status do pedido muda';