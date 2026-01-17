-- Adicionar coluna slug na tabela establishments
ALTER TABLE establishments ADD COLUMN slug TEXT UNIQUE;

-- Criar índice para buscas rápidas por slug
CREATE INDEX idx_establishments_slug ON establishments(slug);

-- Gerar slugs para estabelecimentos existentes
UPDATE establishments 
SET slug = lower(
  regexp_replace(
    regexp_replace(
      translate(name, 'áàãâéèêíìîóòõôúùûçÁÀÃÂÉÈÊÍÌÎÓÒÕÔÚÙÛÇ', 'aaaaeeeiiioooouuucAAAAEEEIIIOOOOUUUC'),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
)
WHERE slug IS NULL;

-- Atualizar view pública para incluir slug
DROP VIEW IF EXISTS public_establishments;
CREATE VIEW public_establishments WITH (security_invoker = on) AS
SELECT 
  id, 
  name, 
  logo_url, 
  plan_status, 
  trial_end_date, 
  plan_expires_at,
  slug
FROM establishments;