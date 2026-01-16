-- =============================================
-- MIGRAÇÃO DE SEGURANÇA: Correção de vulnerabilidades
-- =============================================

-- 1. Criar enum de roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Criar tabela de roles de usuário
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Criar função SECURITY DEFINER para verificar roles (evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Políticas RLS para user_roles
-- Admins podem ver todas as roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver apenas suas próprias roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Apenas admins podem gerenciar roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Remover política pública insegura que expõe dados sensíveis
DROP POLICY IF EXISTS "Public can view establishments for menu" ON public.establishments;

-- 7. Criar VIEW pública segura para cardápio (apenas dados não-sensíveis)
CREATE OR REPLACE VIEW public.public_establishments
WITH (security_invoker = on)
AS
SELECT 
    id,
    name,
    logo_url,
    plan_status
FROM public.establishments;

-- 8. Conceder acesso à view para usuários anônimos e autenticados
GRANT SELECT ON public.public_establishments TO anon, authenticated;

-- 9. Criar política para permitir que donos de estabelecimento vejam seus próprios dados completos
-- (a política "Users can view their own establishment" já existe e é suficiente)