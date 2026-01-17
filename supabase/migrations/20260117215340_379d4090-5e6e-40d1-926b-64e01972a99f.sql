-- Primeiro, criar a função de normalização
CREATE OR REPLACE FUNCTION public.normalize_establishment_data()
RETURNS TRIGGER AS $$
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

-- Criar trigger para normalizar dados antes de insert/update
CREATE TRIGGER establishment_normalize_data
BEFORE INSERT OR UPDATE ON public.establishments
FOR EACH ROW EXECUTE FUNCTION public.normalize_establishment_data();

-- Normalizar dados existentes antes de adicionar constraints
UPDATE public.establishments SET 
  cpf_cnpj = regexp_replace(cpf_cnpj, '[^0-9]', '', 'g'),
  whatsapp = regexp_replace(whatsapp, '[^0-9]', '', 'g'),
  email = lower(trim(email));

-- Adicionar constraints de unicidade
ALTER TABLE public.establishments 
ADD CONSTRAINT establishments_cpf_cnpj_unique UNIQUE (cpf_cnpj);

ALTER TABLE public.establishments 
ADD CONSTRAINT establishments_whatsapp_unique UNIQUE (whatsapp);

ALTER TABLE public.establishments 
ADD CONSTRAINT establishments_email_unique UNIQUE (email);