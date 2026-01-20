-- Add sales page customization fields to resellers table
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS sales_page_title TEXT;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS sales_page_subtitle TEXT;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#4A9BD9';
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#4CAF50';
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS show_prices BOOLEAN DEFAULT true;
ALTER TABLE public.resellers ADD COLUMN IF NOT EXISTS custom_cta_text TEXT;