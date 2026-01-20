-- Criar tabela de clientes
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp TEXT NOT NULL,
  name TEXT NOT NULL,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  reference_point TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT customers_whatsapp_unique UNIQUE (whatsapp)
);

-- Habilitar RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode criar/ler/atualizar (cliente não usa Supabase Auth)
CREATE POLICY "Customers public read" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Customers public insert" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Customers public update" ON public.customers FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de favoritos
CREATE TABLE public.customer_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_customer_favorite UNIQUE (customer_id, establishment_id, product_id)
);

-- Habilitar RLS
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para favoritos
CREATE POLICY "Favorites public read" ON public.customer_favorites FOR SELECT USING (true);
CREATE POLICY "Favorites public insert" ON public.customer_favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Favorites public delete" ON public.customer_favorites FOR DELETE USING (true);

-- Adicionar campos estruturados na tabela saved_addresses
ALTER TABLE public.saved_addresses
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT;