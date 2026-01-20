-- Adicionar coluna plan_type para identificar tipo de plano
ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial';

-- Comentário explicativo
COMMENT ON COLUMN establishments.plan_type IS 
'Tipo do plano: trial, basic, pro, pro_plus';

-- Criar índice para queries
CREATE INDEX IF NOT EXISTS idx_establishments_plan_type 
ON establishments(plan_type);