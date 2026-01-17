-- Fix function search path for normalize_establishment_data
CREATE OR REPLACE FUNCTION public.normalize_establishment_data()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Normalizar CPF/CNPJ removendo caracteres não numéricos
  NEW.cpf_cnpj := regexp_replace(NEW.cpf_cnpj, '[^0-9]', '', 'g');
  -- Normalizar WhatsApp removendo caracteres não numéricos
  NEW.whatsapp := regexp_replace(NEW.whatsapp, '[^0-9]', '', 'g');
  -- Normalizar email para minúsculo e sem espaços
  NEW.email := lower(trim(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;