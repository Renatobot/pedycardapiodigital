-- Corrigir função get_establishment_contact para validar plano ativo
CREATE OR REPLACE FUNCTION public.get_establishment_contact(establishment_id uuid)
RETURNS TABLE(whatsapp text, pix_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só retorna contato para estabelecimentos com plano ativo
  RETURN QUERY
  SELECT e.whatsapp, e.pix_key
  FROM establishments e
  WHERE e.id = establishment_id
    AND (
      -- Plano pago ativo
      (e.plan_status = 'active' AND e.plan_expires_at > now())
      -- OU trial ativo
      OR (e.plan_status = 'trial' AND e.trial_end_date > now())
    );
END;
$$;

-- Remover política permissiva da tabela email_verifications
DROP POLICY IF EXISTS "Service role can manage email verifications" ON email_verifications;