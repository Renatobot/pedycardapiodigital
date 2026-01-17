-- Criar tabela para armazenar códigos de verificação de email
CREATE TABLE public.email_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Índice para busca rápida por email
CREATE INDEX idx_email_verifications_email ON public.email_verifications(email);

-- Habilitar RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção via service role (edge functions)
CREATE POLICY "Service role can manage email verifications"
ON public.email_verifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Função para limpar verificações expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.email_verifications WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;