-- Adicionar coluna has_completed_onboarding na tabela establishments
ALTER TABLE establishments 
ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT false;

-- Marcar estabelecimentos existentes que já possuem categorias como onboarding completo
UPDATE establishments 
SET has_completed_onboarding = true 
WHERE id IN (
  SELECT DISTINCT establishment_id FROM categories
);