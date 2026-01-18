// Pre-defined option group templates by business niche

export interface OptionTemplate {
  name: string;
  options?: string[];
  pricePerOption?: number;
}

export interface OptionGroupTemplate {
  name: string;
  type: 'single' | 'multiple' | 'flavor';
  isRequired?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options?: OptionTemplate[];
}

export interface NicheTemplate {
  id: string;
  name: string;
  description: string;
  groups: OptionGroupTemplate[];
}

export const NICHE_TEMPLATES: Record<string, NicheTemplate> = {
  pizzaria: {
    id: 'pizzaria',
    name: 'Pizzaria',
    description: 'Tamanhos, sabores e bordas',
    groups: [
      {
        name: 'Tamanho',
        type: 'single',
        isRequired: true,
        options: [
          { name: 'Broto (4 fatias)' },
          { name: 'Média (6 fatias)' },
          { name: 'Grande (8 fatias)' },
          { name: 'Gigante (12 fatias)' },
        ],
      },
      {
        name: 'Borda',
        type: 'single',
        options: [
          { name: 'Sem borda', pricePerOption: 0 },
          { name: 'Catupiry', pricePerOption: 8 },
          { name: 'Cheddar', pricePerOption: 8 },
          { name: 'Chocolate', pricePerOption: 10 },
        ],
      },
    ],
  },
  hamburgueria: {
    id: 'hamburgueria',
    name: 'Hamburgueria',
    description: 'Tipo de pão, ponto da carne e extras',
    groups: [
      {
        name: 'Tipo de Pão',
        type: 'single',
        options: [
          { name: 'Brioche' },
          { name: 'Australiano' },
          { name: 'Tradicional' },
          { name: 'Integral' },
        ],
      },
      {
        name: 'Ponto da Carne',
        type: 'single',
        options: [
          { name: 'Mal passado' },
          { name: 'Ao ponto' },
          { name: 'Bem passado' },
        ],
      },
      {
        name: 'Extras',
        type: 'multiple',
        maxSelections: 5,
        options: [
          { name: 'Bacon extra', pricePerOption: 5 },
          { name: 'Queijo extra', pricePerOption: 4 },
          { name: 'Ovo', pricePerOption: 3 },
          { name: 'Cebola caramelizada', pricePerOption: 4 },
        ],
      },
    ],
  },
  marmitaria: {
    id: 'marmitaria',
    name: 'Marmitaria / Restaurante',
    description: 'Tamanho, proteína e acompanhamentos',
    groups: [
      {
        name: 'Tamanho',
        type: 'single',
        isRequired: true,
        options: [
          { name: 'Pequena (P)' },
          { name: 'Média (M)' },
          { name: 'Grande (G)' },
          { name: 'Extra Grande (GG)' },
        ],
      },
      {
        name: 'Proteína',
        type: 'single',
        isRequired: true,
        options: [
          { name: 'Frango grelhado' },
          { name: 'Carne moída' },
          { name: 'Bife acebolado' },
          { name: 'Peixe frito' },
          { name: 'Ovo frito' },
        ],
      },
      {
        name: 'Acompanhamentos',
        type: 'multiple',
        maxSelections: 3,
        options: [
          { name: 'Arroz branco' },
          { name: 'Feijão' },
          { name: 'Farofa' },
          { name: 'Salada' },
          { name: 'Batata frita' },
          { name: 'Purê' },
        ],
      },
    ],
  },
  acaiteria: {
    id: 'acaiteria',
    name: 'Açaiteria',
    description: 'Tamanho e toppings',
    groups: [
      {
        name: 'Tamanho',
        type: 'single',
        isRequired: true,
        options: [
          { name: '300ml' },
          { name: '500ml' },
          { name: '700ml' },
          { name: '1 Litro' },
        ],
      },
      {
        name: 'Acompanhamentos Grátis',
        type: 'multiple',
        maxSelections: 3,
        options: [
          { name: 'Granola' },
          { name: 'Banana' },
          { name: 'Leite em pó' },
        ],
      },
      {
        name: 'Adicionais Pagos',
        type: 'multiple',
        maxSelections: 10,
        options: [
          { name: 'Morango', pricePerOption: 4 },
          { name: 'Nutella', pricePerOption: 6 },
          { name: 'Leite condensado', pricePerOption: 3 },
          { name: 'Paçoca', pricePerOption: 3 },
        ],
      },
    ],
  },
  pastelaria: {
    id: 'pastelaria',
    name: 'Pastelaria',
    description: 'Tipo de massa e recheios',
    groups: [
      {
        name: 'Tipo de Massa',
        type: 'single',
        options: [
          { name: 'Tradicional' },
          { name: 'Integral' },
          { name: 'Assada' },
        ],
      },
      {
        name: 'Recheio Extra',
        type: 'multiple',
        maxSelections: 2,
        options: [
          { name: 'Queijo extra', pricePerOption: 3 },
          { name: 'Catupiry', pricePerOption: 4 },
          { name: 'Bacon', pricePerOption: 5 },
        ],
      },
    ],
  },
  japonesa: {
    id: 'japonesa',
    name: 'Culinária Japonesa',
    description: 'Molhos e acompanhamentos',
    groups: [
      {
        name: 'Molho',
        type: 'single',
        options: [
          { name: 'Shoyu tradicional' },
          { name: 'Teriaky' },
          { name: 'Agridoce' },
          { name: 'Sem molho' },
        ],
      },
      {
        name: 'Acompanhamentos',
        type: 'multiple',
        maxSelections: 3,
        options: [
          { name: 'Gengibre', pricePerOption: 0 },
          { name: 'Wasabi', pricePerOption: 0 },
          { name: 'Cream cheese extra', pricePerOption: 4 },
        ],
      },
    ],
  },
};

// Keywords to suggest templates based on category name
export const TEMPLATE_KEYWORDS: Record<string, string> = {
  pizza: 'pizzaria',
  pizzas: 'pizzaria',
  lanche: 'hamburgueria',
  lanches: 'hamburgueria',
  burguer: 'hamburgueria',
  burger: 'hamburgueria',
  hamburguer: 'hamburgueria',
  hambúrguer: 'hamburgueria',
  marmita: 'marmitaria',
  marmitas: 'marmitaria',
  prato: 'marmitaria',
  pratos: 'marmitaria',
  refeição: 'marmitaria',
  refeicao: 'marmitaria',
  açaí: 'acaiteria',
  acai: 'acaiteria',
  pastel: 'pastelaria',
  pastéis: 'pastelaria',
  pasteis: 'pastelaria',
  sushi: 'japonesa',
  temaki: 'japonesa',
  japonês: 'japonesa',
  japones: 'japonesa',
};

/**
 * Suggest a template based on category name
 */
export function suggestTemplateForCategory(categoryName: string): NicheTemplate | null {
  const normalized = categoryName.toLowerCase().trim();
  
  for (const [keyword, templateId] of Object.entries(TEMPLATE_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return NICHE_TEMPLATES[templateId] || null;
    }
  }
  
  return null;
}

/**
 * Get all available templates
 */
export function getAllTemplates(): NicheTemplate[] {
  return Object.values(NICHE_TEMPLATES);
}
