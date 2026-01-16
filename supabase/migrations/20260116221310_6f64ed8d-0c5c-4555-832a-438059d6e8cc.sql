-- Create establishments table
CREATE TABLE public.establishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  cpf_cnpj TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  pix_key TEXT,
  trial_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  trial_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  plan_status TEXT NOT NULL DEFAULT 'trial' CHECK (plan_status IN ('trial', 'active', 'expired')),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_additions table
CREATE TABLE public.product_additions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_additions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for establishments
CREATE POLICY "Users can view their own establishment"
  ON public.establishments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own establishment"
  ON public.establishments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own establishment"
  ON public.establishments FOR UPDATE
  USING (auth.uid() = user_id);

-- Public read access for menu viewing (via establishment id)
CREATE POLICY "Public can view establishments for menu"
  ON public.establishments FOR SELECT
  USING (true);

-- RLS Policies for categories
CREATE POLICY "Users can manage their establishment categories"
  ON public.categories FOR ALL
  USING (establishment_id IN (SELECT id FROM public.establishments WHERE user_id = auth.uid()));

CREATE POLICY "Public can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- RLS Policies for products
CREATE POLICY "Users can manage their establishment products"
  ON public.products FOR ALL
  USING (establishment_id IN (SELECT id FROM public.establishments WHERE user_id = auth.uid()));

CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  USING (true);

-- RLS Policies for product_additions
CREATE POLICY "Users can manage their product additions"
  ON public.product_additions FOR ALL
  USING (product_id IN (
    SELECT p.id FROM public.products p
    JOIN public.establishments e ON p.establishment_id = e.id
    WHERE e.user_id = auth.uid()
  ));

CREATE POLICY "Public can view product additions"
  ON public.product_additions FOR SELECT
  USING (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);

-- Storage policies for images bucket
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images' AND auth.role() = 'authenticated');