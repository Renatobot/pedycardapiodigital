// Pre-defined option group templates by business niche
// Também contém dados para criação de cardápio inicial

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
  priceRule?: 'highest' | 'average' | 'sum';
  options?: OptionTemplate[];
}

export interface ProductTemplate {
  name: string;
  description: string;
  price: number;
}

export interface CategoryTemplate {
  name: string;
  products: ProductTemplate[];
}

export interface NicheTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  groups: OptionGroupTemplate[];
  categories?: CategoryTemplate[];
}

export const NICHE_TEMPLATES: Record<string, NicheTemplate> = {
  pizzaria: {
    id: 'pizzaria',
    name: 'Pizzaria',
    icon: '🍕',
    description: 'Pizzas, bebidas e sobremesas',
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
        maxSelections: 2,
        priceRule: 'highest',
        options: [
          { name: 'Mussarela', pricePerOption: 45 },
          { name: 'Calabresa', pricePerOption: 48 },
          { name: 'Portuguesa', pricePerOption: 52 },
          { name: 'Frango com Catupiry', pricePerOption: 55 },
          { name: 'Quatro Queijos', pricePerOption: 58 },
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
    categories: [
      {
        name: 'Pizzas Tradicionais',
        products: [
          { name: 'Mussarela', description: 'Molho de tomate, mussarela e orégano', price: 45.00 },
          { name: 'Calabresa', description: 'Molho de tomate, mussarela, calabresa fatiada e cebola', price: 48.00 },
          { name: 'Margherita', description: 'Molho de tomate, mussarela, tomate e manjericão fresco', price: 50.00 },
          { name: 'Portuguesa', description: 'Molho, mussarela, presunto, ovo, cebola, ervilha e azeitona', price: 52.00 },
        ]
      },
      {
        name: 'Pizzas Especiais',
        products: [
          { name: 'Frango com Catupiry', description: 'Molho, mussarela, frango desfiado e catupiry', price: 55.00 },
          { name: 'Quatro Queijos', description: 'Mussarela, provolone, parmesão e gorgonzola', price: 58.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Refrigerante 2L', description: 'Coca-Cola, Guaraná ou Sprite', price: 12.00 },
          { name: 'Refrigerante Lata', description: '350ml', price: 6.00 },
        ]
      }
    ]
  },
  hamburgueria: {
    id: 'hamburgueria',
    name: 'Hamburgueria',
    icon: '🍔',
    description: 'Lanches, combos e bebidas',
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
    categories: [
      {
        name: 'Hambúrgueres',
        products: [
          { name: 'X-Burguer Tradicional', description: 'Pão brioche, carne 150g, queijo cheddar, alface e tomate', price: 22.90 },
          { name: 'X-Bacon', description: 'Pão brioche, carne 150g, queijo, bacon crocante, alface e tomate', price: 27.90 },
          { name: 'X-Salada', description: 'Pão brioche, carne 150g, queijo, alface, tomate e maionese da casa', price: 24.90 },
          { name: 'X-Tudo', description: 'Pão brioche, carne 150g, queijo, bacon, ovo, presunto, alface e tomate', price: 32.90 },
        ]
      },
      {
        name: 'Porções',
        products: [
          { name: 'Batata Frita', description: 'Porção de batata frita crocante (300g)', price: 18.00 },
          { name: 'Onion Rings', description: 'Anéis de cebola empanados (200g)', price: 22.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Coca-Cola Lata', description: '350ml', price: 6.00 },
          { name: 'Guaraná Antarctica Lata', description: '350ml', price: 5.50 },
        ]
      }
    ]
  },
  marmitaria: {
    id: 'marmitaria',
    name: 'Marmitaria',
    icon: '🍱',
    description: 'Marmitas, porções e bebidas',
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
        ],
      },
    ],
    categories: [
      {
        name: 'Marmitas Pequenas',
        products: [
          { name: 'Marmita P - Frango', description: 'Arroz, feijão, salada e frango grelhado (350g)', price: 15.00 },
          { name: 'Marmita P - Carne', description: 'Arroz, feijão, salada e carne acebolada (350g)', price: 16.00 },
        ]
      },
      {
        name: 'Marmitas Grandes',
        products: [
          { name: 'Marmita G - Frango', description: 'Arroz, feijão, salada e frango grelhado (500g)', price: 20.00 },
          { name: 'Marmita G - Carne', description: 'Arroz, feijão, salada e carne acebolada (500g)', price: 22.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Refrigerante Lata', description: '350ml', price: 5.00 },
          { name: 'Suco Natural', description: 'Laranja ou limão - 300ml', price: 6.00 },
        ]
      }
    ]
  },
  acaiteria: {
    id: 'acaiteria',
    name: 'Açaiteria',
    icon: '🫐',
    description: 'Açaí, cremes e complementos',
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
        ],
      },
    ],
    categories: [
      {
        name: 'Açaí no Copo',
        products: [
          { name: 'Açaí 300ml', description: 'Açaí puro batido - escolha até 3 acompanhamentos grátis', price: 14.00 },
          { name: 'Açaí 500ml', description: 'Açaí puro batido - escolha até 4 acompanhamentos grátis', price: 20.00 },
          { name: 'Açaí 700ml', description: 'Açaí puro batido - escolha até 5 acompanhamentos grátis', price: 26.00 },
        ]
      },
      {
        name: 'Açaí na Tigela',
        products: [
          { name: 'Tigela Tradicional', description: 'Açaí, banana, granola e leite condensado', price: 22.00 },
          { name: 'Tigela Tropical', description: 'Açaí, morango, kiwi, granola e mel', price: 26.00 },
        ]
      }
    ]
  },
  pastelaria: {
    id: 'pastelaria',
    name: 'Pastelaria',
    icon: '🥟',
    description: 'Pastéis, caldos e bebidas',
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
    categories: [
      {
        name: 'Pastéis Salgados',
        products: [
          { name: 'Pastel de Carne', description: 'Carne moída bem temperada', price: 8.00 },
          { name: 'Pastel de Queijo', description: 'Queijo mussarela derretido', price: 8.00 },
          { name: 'Pastel de Frango', description: 'Frango desfiado com catupiry', price: 9.00 },
        ]
      },
      {
        name: 'Pastéis Doces',
        products: [
          { name: 'Pastel de Banana com Chocolate', description: 'Banana fatiada com chocolate ao leite', price: 10.00 },
          { name: 'Pastel Romeu e Julieta', description: 'Goiabada cremosa com queijo minas', price: 9.00 },
        ]
      },
      {
        name: 'Caldos',
        products: [
          { name: 'Caldo de Cana', description: 'Caldo de cana natural - 300ml', price: 5.00 },
          { name: 'Caldo de Cana com Limão', description: 'Caldo de cana com limão - 300ml', price: 6.00 },
        ]
      }
    ]
  },
  japonesa: {
    id: 'japonesa',
    name: 'Culinária Japonesa',
    icon: '🍣',
    description: 'Sushis, sashimis e temakis',
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
    categories: [
      {
        name: 'Sushis',
        products: [
          { name: 'Combo 20 peças', description: 'Mix de sushis variados', price: 45.00 },
          { name: 'Combo 30 peças', description: 'Mix de sushis variados', price: 65.00 },
        ]
      },
      {
        name: 'Temakis',
        products: [
          { name: 'Temaki Salmão', description: 'Salmão fresco com cream cheese', price: 28.00 },
          { name: 'Temaki Atum', description: 'Atum fresco com cebolinha', price: 26.00 },
        ]
      }
    ]
  },
  petshop: {
    id: 'petshop',
    name: 'Pet Shop',
    icon: '🐾',
    description: 'Banho, tosa e serviços',
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
        ],
      },
    ],
    categories: [
      {
        name: 'Banho e Tosa',
        products: [
          { name: 'Banho Simples P', description: 'Banho para cães de pequeno porte', price: 40.00 },
          { name: 'Banho Simples M', description: 'Banho para cães de médio porte', price: 55.00 },
          { name: 'Banho e Tosa P', description: 'Banho completo com tosa para pequeno porte', price: 70.00 },
        ]
      },
      {
        name: 'Acessórios',
        products: [
          { name: 'Coleira Nylon P', description: 'Coleira de nylon ajustável', price: 25.00 },
          { name: 'Brinquedo Mordedor', description: 'Mordedor de borracha', price: 18.00 },
        ]
      }
    ]
  },
  loja_racao: {
    id: 'loja_racao',
    name: 'Loja de Ração',
    icon: '🦴',
    description: 'Rações e petiscos',
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
        ],
      },
      {
        name: 'Sabor / Tipo',
        type: 'single',
        options: [
          { name: 'Carne' },
          { name: 'Frango' },
          { name: 'Filhotes' },
          { name: 'Adultos' },
        ],
      },
    ],
    categories: [
      {
        name: 'Rações para Cães',
        products: [
          { name: 'Ração Premium 3kg', description: 'Ração premium para cães adultos', price: 55.00 },
          { name: 'Ração Premium 15kg', description: 'Ração premium para cães adultos', price: 180.00 },
        ]
      },
      {
        name: 'Petiscos',
        products: [
          { name: 'Bifinho de Carne', description: 'Pacote com 10 unidades', price: 12.00 },
          { name: 'Ossinho Dental', description: 'Pacote com 5 unidades', price: 15.00 },
        ]
      }
    ]
  },
  farmacia: {
    id: 'farmacia',
    name: 'Farmácia',
    icon: '💊',
    description: 'Medicamentos e produtos',
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
        ],
      },
    ],
    categories: [
      {
        name: 'Medicamentos',
        products: [
          { name: 'Dipirona 500mg', description: '20 comprimidos', price: 8.00 },
          { name: 'Ibuprofeno 600mg', description: '20 comprimidos', price: 15.00 },
        ]
      },
      {
        name: 'Higiene',
        products: [
          { name: 'Sabonete Líquido', description: '250ml', price: 12.00 },
          { name: 'Álcool em Gel', description: '500ml', price: 18.00 },
        ]
      }
    ]
  },
  deposito_bebidas: {
    id: 'deposito_bebidas',
    name: 'Depósito de Bebidas',
    icon: '🍺',
    description: 'Cervejas, refrigerantes e destilados',
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
        ],
      },
    ],
    categories: [
      {
        name: 'Cervejas',
        products: [
          { name: 'Brahma Litrão', description: '1 litro - Gelada', price: 9.00 },
          { name: 'Heineken Long Neck', description: '330ml - Gelada', price: 8.00 },
        ]
      },
      {
        name: 'Refrigerantes',
        products: [
          { name: 'Coca-Cola 2L', description: 'Gelada ou natural', price: 12.00 },
          { name: 'Guaraná Antarctica 2L', description: 'Gelado ou natural', price: 10.00 },
        ]
      },
      {
        name: 'Destilados',
        products: [
          { name: 'Vodka Smirnoff', description: '1 litro', price: 45.00 },
          { name: 'Whisky Red Label', description: '1 litro', price: 90.00 },
        ]
      }
    ]
  },
  sorveteria: {
    id: 'sorveteria',
    name: 'Sorveteria',
    icon: '🍦',
    description: 'Sorvetes, sundaes e milkshakes',
    groups: [
      {
        name: 'Tamanho',
        type: 'single',
        isRequired: true,
        options: [
          { name: 'Pequeno (1 bola)' },
          { name: 'Médio (2 bolas)' },
          { name: 'Grande (3 bolas)' },
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
        ],
      },
    ],
    categories: [
      {
        name: 'Sorvetes no Copo',
        products: [
          { name: 'Sorvete 1 Bola', description: 'Escolha seu sabor favorito', price: 8.00 },
          { name: 'Sorvete 2 Bolas', description: 'Escolha 2 sabores', price: 14.00 },
        ]
      },
      {
        name: 'Milkshakes',
        products: [
          { name: 'Milkshake Tradicional', description: 'Chocolate, morango ou baunilha - 400ml', price: 15.00 },
          { name: 'Milkshake Ovomaltine', description: 'Sorvete de creme com ovomaltine - 400ml', price: 18.00 },
        ]
      }
    ]
  },
  padaria: {
    id: 'padaria',
    name: 'Padaria',
    icon: '🥐',
    description: 'Pães, doces e salgados',
    groups: [
      {
        name: 'Tamanho do Bolo',
        type: 'single',
        options: [
          { name: 'Mini (serve 4)' },
          { name: 'Pequeno (serve 10)' },
          { name: 'Médio (serve 20)' },
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
        ],
      },
    ],
    categories: [
      {
        name: 'Pães',
        products: [
          { name: 'Pão Francês', description: 'Unidade', price: 0.80 },
          { name: 'Pão de Queijo', description: 'Unidade', price: 3.00 },
        ]
      },
      {
        name: 'Salgados',
        products: [
          { name: 'Coxinha', description: 'Coxinha de frango', price: 6.00 },
          { name: 'Esfiha', description: 'Esfiha de carne', price: 5.00 },
        ]
      },
      {
        name: 'Doces',
        products: [
          { name: 'Bolo de Cenoura', description: 'Fatia com cobertura de chocolate', price: 8.00 },
          { name: 'Brigadeiro', description: 'Unidade', price: 3.00 },
        ]
      }
    ]
  },
  hortifruti: {
    id: 'hortifruti',
    name: 'Hortifrúti',
    icon: '🥬',
    description: 'Frutas, verduras e legumes',
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
        ],
      },
      {
        name: 'Maturação (frutas)',
        type: 'single',
        options: [
          { name: 'Verde (amadurece em casa)' },
          { name: 'Maduro (pronto para consumo)' },
        ],
      },
    ],
    categories: [
      {
        name: 'Frutas',
        products: [
          { name: 'Banana Prata', description: 'Por kg', price: 6.00 },
          { name: 'Maçã Fuji', description: 'Por kg', price: 12.00 },
          { name: 'Laranja', description: 'Por kg', price: 5.00 },
        ]
      },
      {
        name: 'Verduras',
        products: [
          { name: 'Alface Crespa', description: 'Maço', price: 4.00 },
          { name: 'Couve', description: 'Maço', price: 5.00 },
        ]
      },
      {
        name: 'Legumes',
        products: [
          { name: 'Tomate', description: 'Por kg', price: 8.00 },
          { name: 'Batata', description: 'Por kg', price: 6.00 },
        ]
      }
    ]
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
  // Loja de Ração
  ração: 'loja_racao',
  racao: 'loja_racao',
  // Farmácia
  farmácia: 'farmacia',
  farmacia: 'farmacia',
  medicamento: 'farmacia',
  remédio: 'farmacia',
  remedio: 'farmacia',
  // Depósito de Bebidas
  bebida: 'deposito_bebidas',
  bebidas: 'deposito_bebidas',
  cerveja: 'deposito_bebidas',
  refrigerante: 'deposito_bebidas',
  // Sorveteria
  sorvete: 'sorveteria',
  sorvetes: 'sorveteria',
  milkshake: 'sorveteria',
  geladinho: 'sorveteria',
  // Padaria
  padaria: 'padaria',
  pão: 'padaria',
  pao: 'padaria',
  bolo: 'padaria',
  confeitaria: 'padaria',
  // Hortifrúti
  hortifruti: 'hortifruti',
  hortifrúti: 'hortifruti',
  fruta: 'hortifruti',
  frutas: 'hortifruti',
  verdura: 'hortifruti',
  verduras: 'hortifruti',
  legume: 'hortifruti',
  legumes: 'hortifruti',
};

// Suggest template based on category name
export function suggestTemplateForCategory(categoryName: string): NicheTemplate | null {
  const normalized = categoryName.toLowerCase().trim();
  
  for (const [keyword, templateId] of Object.entries(TEMPLATE_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return NICHE_TEMPLATES[templateId] || null;
    }
  }
  
  return null;
}

// Get all available templates
export function getAllTemplates(): NicheTemplate[] {
  return Object.values(NICHE_TEMPLATES);
}
