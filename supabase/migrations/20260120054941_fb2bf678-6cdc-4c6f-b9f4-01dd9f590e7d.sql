-- View segura para dados de estabelecimentos que revendedores podem ver
-- SEM CPF/CNPJ, Email ou acesso ao cardápio
CREATE OR REPLACE VIEW public.reseller_establishments_view
WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.name,
  e.whatsapp,
  e.plan_status,
  e.plan_type,
  e.plan_expires_at,
  e.trial_end_date,
  e.created_at,
  e.reseller_id,
  e.activated_by_reseller
FROM establishments e
WHERE e.reseller_id IS NOT NULL;

-- Comentário explicando restrições
COMMENT ON VIEW public.reseller_establishments_view IS 'View segura para revendedores - exclui CPF, CNPJ, email e dados sensíveis';