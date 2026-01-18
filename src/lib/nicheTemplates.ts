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
  priceRule?: 'highest' | 'average' | 'sum'; // Regra de preço para sabores
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
    description: 'Tamanhos, sabores (meio a meio) e bordas',
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
        name: 'Sabores da Pizza',
        type: 'flavor',
        isRequired: true,
        minSelections: 1,
        maxSelections: 2, // Meio a meio = 2 sabores
        priceRule: 'highest', // Cobra pelo mais caro
        options: [
          { name: 'Mussarela', pricePerOption: 45 },
          { name: 'Calabresa', pricePerOption: 48 },
          { name: 'Portuguesa', pricePerOption: 52 },
          { name: 'Frango com Catupiry', pricePerOption: 55 },
          { name: 'Quatro Queijos', pricePerOption: 58 },
          { name: 'Lombo Canadense', pricePerOption: 60 },
          { name: 'Camarão', pricePerOption: 75 },
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
  petshop: {
    id: 'petshop',
    name: 'Pet Shop',
    description: 'Porte do animal e serviços extras',
    groups: [
      {
        name: 'Porte do Animal',
        type: 'single',
        isRequired: true,
        options: [
          { name: 'Pequeno (até 10kg)' },
          { name: 'Médio (10-25kg)' },
          { name: 'Grande (acima de 25kg)' },
        ],
      },
      {
        name: 'Serviços Extras',
        type: 'multiple',
        maxSelections: 5,
        options: [
          { name: 'Tosa higiênica', pricePerOption: 20 },
          { name: 'Corte de unhas', pricePerOption: 15 },
          { name: 'Limpeza de ouvidos', pricePerOption: 10 },
          { name: 'Hidratação', pricePerOption: 25 },
          { name: 'Perfume', pricePerOption: 10 },
        ],
      },
    ],
  },
  loja_racao: {
    id: 'loja_racao',
    name: 'Loja de Ração',
    description: 'Peso e tipo de ração',
    groups: [
      {
        name: 'Peso',
        type: 'single',
        isRequired: true,
        options: [
          { name: '1kg' },
          { name: '3kg' },
          { name: '7kg' },
          { name: '15kg' },
          { name: 'A granel (por kg)' },
        ],
      },
      {
        name: 'Sabor / Tipo',
        type: 'single',
        options: [
          { name: 'Carne' },
          { name: 'Frango' },
          { name: 'Carne e Vegetais' },
          { name: 'Filhotes' },
          { name: 'Adultos' },
          { name: 'Idosos' },
        ],
      },
    ],
  },
  farmacia: {
    id: 'farmacia',
    name: 'Farmácia / Drogaria',
    description: 'Dosagem e quantidade',
    groups: [
      {
        name: 'Dosagem',
        type: 'single',
        options: [
          { name: '100mg' },
          { name: '200mg' },
          { name: '500mg' },
          { name: '1g' },
        ],
      },
      {
        name: 'Quantidade',
        type: 'single',
        options: [
          { name: '10 comprimidos' },
          { name: '20 comprimidos' },
          { name: '30 comprimidos' },
          { name: '60 comprimidos' },
        ],
      },
    ],
  },
  deposito_bebidas: {
    id: 'deposito_bebidas',
    name: 'Depósito de Bebidas',
    description: 'Temperatura e quantidade',
    groups: [
      {
        name: 'Temperatura',
        type: 'single',
        options: [
          { name: 'Gelada' },
          { name: 'Normal (ambiente)' },
        ],
      },
      {
        name: 'Quantidade',
        type: 'single',
        options: [
          { name: 'Unidade' },
          { name: 'Pack (6 unidades)' },
          { name: 'Caixa (12 unidades)' },
          { name: 'Engradado (24 unidades)' },
        ],
      },
    ],
  },
  sorveteria: {
    id: 'sorveteria',
    name: 'Sorveteria / Geladinho',
    description: 'Tamanho, sabores e coberturas',
    groups: [
      {
        name: 'Tamanho',
        type: 'single',
        isRequired: true,
        options: [
          { name: 'Pequeno (1 bola)' },
          { name: 'Médio (2 bolas)' },
          { name: 'Grande (3 bolas)' },
          { name: 'Casquinha' },
        ],
      },
      {
        name: 'Sabores',
        type: 'flavor',
        maxSelections: 3,
        options: [
          { name: 'Chocolate' },
          { name: 'Morango' },
          { name: 'Creme' },
          { name: 'Flocos' },
          { name: 'Limão' },
          { name: 'Maracujá' },
        ],
      },
      {
        name: 'Coberturas',
        type: 'multiple',
        maxSelections: 3,
        options: [
          { name: 'Calda de chocolate', pricePerOption: 3 },
          { name: 'Granulado', pricePerOption: 2 },
          { name: 'Chantilly', pricePerOption: 3 },
          { name: 'Leite condensado', pricePerOption: 3 },
        ],
      },
    ],
  },
  padaria: {
    id: 'padaria',
    name: 'Padaria / Confeitaria',
    description: 'Tamanho, recheio e cobertura',
    groups: [
      {
        name: 'Tamanho do Bolo',
        type: 'single',
        options: [
          { name: 'Mini (serve 4)' },
          { name: 'Pequeno (serve 10)' },
          { name: 'Médio (serve 20)' },
          { name: 'Grande (serve 40)' },
        ],
      },
      {
        name: 'Recheio',
        type: 'multiple',
        maxSelections: 2,
        options: [
          { name: 'Brigadeiro' },
          { name: 'Beijinho' },
          { name: 'Morango com chantilly' },
          { name: 'Doce de leite' },
          { name: 'Nutella', pricePerOption: 15 },
        ],
      },
      {
        name: 'Cobertura',
        type: 'single',
        options: [
          { name: 'Chantilly' },
          { name: 'Ganache' },
          { name: 'Pasta americana', pricePerOption: 30 },
          { name: 'Naked (sem cobertura)' },
        ],
      },
    ],
  },
  hortifruti: {
    id: 'hortifruti',
    name: 'Hortifrúti / Verduras',
    description: 'Peso e maturação',
    groups: [
      {
        name: 'Peso / Quantidade',
        type: 'single',
        isRequired: true,
        options: [
          { name: '500g' },
          { name: '1kg' },
          { name: '2kg' },
          { name: 'Unidade' },
          { name: 'Maço' },
          { name: 'Bandeja' },
        ],
      },
      {
        name: 'Maturação (frutas)',
        type: 'single',
        options: [
          { name: 'Verde (amadurece em casa)' },
          { name: 'Maduro (pronto para consumo)' },
          { name: 'Muito maduro (ideal para sucos)' },
        ],
      },
    ],
  },
};

// Keywords to suggest templates based on category name
export const TEMPLATE_KEYWORDS: Record<string, string> = {
  // Pizzaria
  pizza: 'pizzaria',
  pizzas: 'pizzaria',
  // Hamburgueria
  lanche: 'hamburgueria',
  lanches: 'hamburgueria',
  burguer: 'hamburgueria',
  burger: 'hamburgueria',
  hamburguer: 'hamburgueria',
  hambúrguer: 'hamburgueria',
  // Marmitaria
  marmita: 'marmitaria',
  marmitas: 'marmitaria',
  prato: 'marmitaria',
  pratos: 'marmitaria',
  refeição: 'marmitaria',
  refeicao: 'marmitaria',
  // Açaiteria
  açaí: 'acaiteria',
  acai: 'acaiteria',
  // Pastelaria
  pastel: 'pastelaria',
  pastéis: 'pastelaria',
  pasteis: 'pastelaria',
  // Japonesa
  sushi: 'japonesa',
  temaki: 'japonesa',
  japonês: 'japonesa',
  japones: 'japonesa',
  // Pet Shop
  pet: 'petshop',
  banho: 'petshop',
  tosa: 'petshop',
  cachorro: 'petshop',
  gato: 'petshop',
  animal: 'petshop',
  // Loja de Ração
  ração: 'loja_racao',
  racao: 'loja_racao',
  agropecuária: 'loja_racao',
  agropecuaria: 'loja_racao',
  // Farmácia
  farmácia: 'farmacia',
  farmacia: 'farmacia',
  medicamento: 'farmacia',
  remédio: 'farmacia',
  remedio: 'farmacia',
  drogaria: 'farmacia',
  // Depósito de Bebidas
  bebida: 'deposito_bebidas',
  bebidas: 'deposito_bebidas',
  cerveja: 'deposito_bebidas',
  refrigerante: 'deposito_bebidas',
  depósito: 'deposito_bebidas',
  deposito: 'deposito_bebidas',
  // Sorveteria
  sorvete: 'sorveteria',
  sorvetes: 'sorveteria',
  gelado: 'sorveteria',
  geladinho: 'sorveteria',
  picolé: 'sorveteria',
  picole: 'sorveteria',
  // Padaria
  pão: 'padaria',
  pao: 'padaria',
  bolo: 'padaria',
  bolos: 'padaria',
  confeitaria: 'padaria',
  padaria: 'padaria',
  doce: 'padaria',
  doces: 'padaria',
  // Hortifrúti
  fruta: 'hortifruti',
  frutas: 'hortifruti',
  verdura: 'hortifruti',
  verduras: 'hortifruti',
  legume: 'hortifruti',
  legumes: 'hortifruti',
  hortifruti: 'hortifruti',
  hortifrúti: 'hortifruti',
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
