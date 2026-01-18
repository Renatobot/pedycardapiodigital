-- Adicionar coluna price_rule nos grupos de opções para pizza meio a meio
ALTER TABLE product_option_groups 
ADD COLUMN IF NOT EXISTS price_rule text DEFAULT 'highest';

-- Comentário explicativo
COMMENT ON COLUMN product_option_groups.price_rule IS 'Regra de precificação para grupos de sabores: highest (maior valor), average (média), sum (soma)';