// Templates de cardápio inicial por nicho
// Usado para criar categorias e produtos de exemplo após o cadastro

export interface ProductTemplate {
  name: string;
  description: string;
  price: number;
  imagePlaceholder?: string;
}

export interface CategoryTemplate {
  name: string;
  products: ProductTemplate[];
}

export interface MenuTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  categories: CategoryTemplate[];
}

export const MENU_TEMPLATES: Record<string, MenuTemplate> = {
  hamburgueria: {
    id: 'hamburgueria',
    name: 'Hamburgueria',
    icon: '🍔',
    description: 'Lanches, combos e bebidas',
    categories: [
      {
        name: 'Hambúrgueres',
        products: [
          { name: 'X-Burguer Tradicional', description: 'Pão brioche, carne 150g, queijo cheddar, alface e tomate', price: 22.90 },
          { name: 'X-Bacon', description: 'Pão brioche, carne 150g, queijo, bacon crocante, alface e tomate', price: 27.90 },
          { name: 'X-Salada', description: 'Pão brioche, carne 150g, queijo, alface, tomate e maionese da casa', price: 24.90 },
          { name: 'X-Tudo', description: 'Pão brioche, carne 150g, queijo, bacon, ovo, presunto, alface e tomate', price: 32.90 },
          { name: 'Smash Burger Duplo', description: 'Pão, 2 carnes smash 80g, queijo cheddar, cebola caramelizada e molho especial', price: 35.90 },
        ]
      },
      {
        name: 'Porções',
        products: [
          { name: 'Batata Frita', description: 'Porção de batata frita crocante (300g)', price: 18.00 },
          { name: 'Onion Rings', description: 'Anéis de cebola empanados (200g)', price: 22.00 },
          { name: 'Nuggets', description: 'Porção com 10 unidades + molho', price: 20.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Coca-Cola Lata', description: '350ml', price: 6.00 },
          { name: 'Guaraná Antarctica Lata', description: '350ml', price: 5.50 },
          { name: 'Suco Natural', description: 'Laranja, limão ou maracujá - 300ml', price: 8.00 },
          { name: 'Água Mineral', description: '500ml', price: 4.00 },
        ]
      },
      {
        name: 'Sobremesas',
        products: [
          { name: 'Brownie', description: 'Brownie de chocolate com sorvete de creme', price: 12.00 },
          { name: 'Milk Shake', description: 'Chocolate, morango ou ovomaltine - 400ml', price: 15.00 },
          { name: 'Petit Gateau', description: 'Bolo de chocolate com recheio cremoso e sorvete', price: 18.00 },
        ]
      }
    ]
  },
  pastelaria: {
    id: 'pastelaria',
    name: 'Pastelaria',
    icon: '🥟',
    description: 'Pastéis, caldos e bebidas',
    categories: [
      {
        name: 'Pastéis Salgados',
        products: [
          { name: 'Pastel de Carne', description: 'Carne moída bem temperada', price: 8.00 },
          { name: 'Pastel de Queijo', description: 'Queijo mussarela derretido', price: 8.00 },
          { name: 'Pastel de Frango', description: 'Frango desfiado com catupiry', price: 9.00 },
          { name: 'Pastel de Pizza', description: 'Presunto, queijo, tomate e orégano', price: 9.00 },
          { name: 'Pastel de Carne Seca', description: 'Carne seca desfiada com cream cheese', price: 11.00 },
          { name: 'Pastel Especial', description: 'Carne, queijo, ovo e azeitona', price: 12.00 },
        ]
      },
      {
        name: 'Pastéis Doces',
        products: [
          { name: 'Pastel de Banana com Chocolate', description: 'Banana fatiada com chocolate ao leite', price: 10.00 },
          { name: 'Pastel Romeu e Julieta', description: 'Goiabada cremosa com queijo minas', price: 9.00 },
          { name: 'Pastel de Doce de Leite', description: 'Doce de leite cremoso', price: 9.00 },
        ]
      },
      {
        name: 'Caldos',
        products: [
          { name: 'Caldo de Cana', description: 'Caldo de cana natural - 300ml', price: 5.00 },
          { name: 'Caldo de Cana com Limão', description: 'Caldo de cana com limão - 300ml', price: 6.00 },
          { name: 'Caldo de Cana com Abacaxi', description: 'Caldo de cana com abacaxi - 300ml', price: 7.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Refrigerante Lata', description: '350ml - Coca, Guaraná ou Fanta', price: 5.50 },
          { name: 'Suco Natural', description: 'Laranja ou limão - 300ml', price: 7.00 },
          { name: 'Água Mineral', description: '500ml', price: 4.00 },
        ]
      }
    ]
  },
  acaiteria: {
    id: 'acaiteria',
    name: 'Açaiteria',
    icon: '🫐',
    description: 'Açaí, cremes e complementos',
    categories: [
      {
        name: 'Açaí no Copo',
        products: [
          { name: 'Açaí 300ml', description: 'Açaí puro batido - escolha até 3 acompanhamentos grátis', price: 14.00 },
          { name: 'Açaí 500ml', description: 'Açaí puro batido - escolha até 4 acompanhamentos grátis', price: 20.00 },
          { name: 'Açaí 700ml', description: 'Açaí puro batido - escolha até 5 acompanhamentos grátis', price: 26.00 },
          { name: 'Açaí 1 Litro', description: 'Açaí puro batido - escolha até 6 acompanhamentos grátis', price: 32.00 },
        ]
      },
      {
        name: 'Açaí na Tigela',
        products: [
          { name: 'Tigela Tradicional', description: 'Açaí, banana, granola e leite condensado', price: 22.00 },
          { name: 'Tigela Tropical', description: 'Açaí, morango, kiwi, granola e mel', price: 26.00 },
          { name: 'Tigela Premium', description: 'Açaí, frutas variadas, granola, nutella e leite ninho', price: 32.00 },
          { name: 'Tigela Fitness', description: 'Açaí sem açúcar, banana, aveia e pasta de amendoim', price: 28.00 },
        ]
      },
      {
        name: 'Cremes',
        products: [
          { name: 'Creme de Cupuaçu 300ml', description: 'Cupuaçu cremoso', price: 12.00 },
          { name: 'Creme de Cupuaçu 500ml', description: 'Cupuaçu cremoso', price: 18.00 },
          { name: 'Vitamina de Açaí', description: 'Açaí batido com banana e leite - 400ml', price: 16.00 },
        ]
      },
      {
        name: 'Adicionais',
        products: [
          { name: 'Nutella', description: 'Porção extra generosa', price: 6.00 },
          { name: 'Leite em Pó', description: 'Porção extra', price: 3.00 },
          { name: 'Paçoca', description: 'Porção triturada', price: 2.50 },
          { name: 'Morango', description: 'Porção de morango fresco', price: 4.00 },
        ]
      }
    ]
  },
  pizzaria: {
    id: 'pizzaria',
    name: 'Pizzaria',
    icon: '🍕',
    description: 'Pizzas, bebidas e sobremesas',
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
          { name: 'Lombo Canadense', description: 'Molho, mussarela, lombo canadense e catupiry', price: 60.00 },
          { name: 'Camarão', description: 'Molho branco, mussarela e camarões salteados', price: 75.00 },
        ]
      },
      {
        name: 'Pizzas Doces',
        products: [
          { name: 'Chocolate', description: 'Chocolate ao leite com granulado', price: 42.00 },
          { name: 'Romeu e Julieta', description: 'Goiabada cremosa com queijo minas', price: 44.00 },
          { name: 'Banana com Canela', description: 'Banana fatiada, açúcar e canela', price: 40.00 },
          { name: 'Prestígio', description: 'Chocolate com coco ralado', price: 45.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Refrigerante 2L', description: 'Coca-Cola, Guaraná ou Sprite', price: 12.00 },
          { name: 'Refrigerante Lata', description: '350ml', price: 6.00 },
          { name: 'Suco Natural 1L', description: 'Laranja ou Uva', price: 10.00 },
          { name: 'Água Mineral', description: '500ml', price: 4.00 },
        ]
      }
    ]
  },
  sorveteria: {
    id: 'sorveteria',
    name: 'Sorveteria',
    icon: '🍦',
    description: 'Sorvetes, sundaes e milkshakes',
    categories: [
      {
        name: 'Sorvetes no Copo',
        products: [
          { name: 'Sorvete 1 Bola', description: 'Escolha seu sabor favorito', price: 8.00 },
          { name: 'Sorvete 2 Bolas', description: 'Escolha 2 sabores', price: 14.00 },
          { name: 'Sorvete 3 Bolas', description: 'Escolha 3 sabores', price: 18.00 },
        ]
      },
      {
        name: 'Sundaes',
        products: [
          { name: 'Sundae Tradicional', description: 'Sorvete, calda de chocolate, chantilly e cereja', price: 16.00 },
          { name: 'Sundae Brownie', description: 'Brownie, sorvete, calda e chantilly', price: 22.00 },
          { name: 'Banana Split', description: 'Banana, 3 bolas de sorvete, caldas e chantilly', price: 24.00 },
        ]
      },
      {
        name: 'Milkshakes',
        products: [
          { name: 'Milkshake Tradicional', description: 'Chocolate, morango ou baunilha - 400ml', price: 15.00 },
          { name: 'Milkshake Ovomaltine', description: 'Sorvete de creme com ovomaltine - 400ml', price: 18.00 },
          { name: 'Milkshake Nutella', description: 'Sorvete de creme com nutella - 400ml', price: 20.00 },
        ]
      },
      {
        name: 'Casquinhas',
        products: [
          { name: 'Casquinha Simples', description: '1 bola na casquinha', price: 6.00 },
          { name: 'Casquinha Dupla', description: '2 bolas na casquinha', price: 10.00 },
          { name: 'Casquinha com Cobertura', description: '1 bola com cobertura de chocolate', price: 9.00 },
        ]
      }
    ]
  },
  deposito_bebidas: {
    id: 'deposito_bebidas',
    name: 'Depósito de Bebidas',
    icon: '🍺',
    description: 'Cervejas, refrigerantes e destilados',
    categories: [
      {
        name: 'Cervejas',
        products: [
          { name: 'Brahma Litrão', description: '1 litro - Gelada', price: 9.00 },
          { name: 'Skol Litrão', description: '1 litro - Gelada', price: 9.00 },
          { name: 'Heineken Long Neck', description: '330ml - Gelada', price: 8.00 },
          { name: 'Corona Long Neck', description: '330ml - Gelada', price: 10.00 },
          { name: 'Budweiser Lata', description: '350ml - Gelada', price: 5.00 },
        ]
      },
      {
        name: 'Refrigerantes',
        products: [
          { name: 'Coca-Cola 2L', description: 'Gelada ou natural', price: 12.00 },
          { name: 'Guaraná Antarctica 2L', description: 'Gelado ou natural', price: 10.00 },
          { name: 'Fanta Laranja 2L', description: 'Gelada ou natural', price: 10.00 },
          { name: 'Coca-Cola Lata', description: '350ml - Gelada', price: 5.00 },
        ]
      },
      {
        name: 'Destilados',
        products: [
          { name: 'Vodka Smirnoff', description: '1 litro', price: 45.00 },
          { name: 'Whisky Red Label', description: '1 litro', price: 90.00 },
          { name: 'Cachaça 51', description: '1 litro', price: 15.00 },
          { name: 'Gin Tanqueray', description: '750ml', price: 120.00 },
        ]
      },
      {
        name: 'Água e Energéticos',
        products: [
          { name: 'Água Mineral', description: '500ml - Gelada', price: 3.00 },
          { name: 'Água Mineral 1,5L', description: 'Galão', price: 5.00 },
          { name: 'Red Bull', description: '250ml', price: 12.00 },
          { name: 'Monster', description: '473ml', price: 10.00 },
        ]
      },
      {
        name: 'Gelo',
        products: [
          { name: 'Gelo 2kg', description: 'Saco de gelo em cubo', price: 8.00 },
          { name: 'Gelo 5kg', description: 'Saco de gelo em cubo', price: 15.00 },
        ]
      }
    ]
  },
  marmitaria: {
    id: 'marmitaria',
    name: 'Marmitaria',
    icon: '🍱',
    description: 'Marmitas, porções e bebidas',
    categories: [
      {
        name: 'Marmitas Pequenas',
        products: [
          { name: 'Marmita P - Frango', description: 'Arroz, feijão, salada e frango grelhado (350g)', price: 15.00 },
          { name: 'Marmita P - Carne', description: 'Arroz, feijão, salada e carne acebolada (350g)', price: 16.00 },
          { name: 'Marmita P - Peixe', description: 'Arroz, feijão, salada e peixe frito (350g)', price: 18.00 },
        ]
      },
      {
        name: 'Marmitas Grandes',
        products: [
          { name: 'Marmita G - Frango', description: 'Arroz, feijão, salada e frango grelhado (500g)', price: 20.00 },
          { name: 'Marmita G - Carne', description: 'Arroz, feijão, salada e carne acebolada (500g)', price: 22.00 },
          { name: 'Marmita G - Peixe', description: 'Arroz, feijão, salada e peixe frito (500g)', price: 25.00 },
          { name: 'Marmita G - Feijoada', description: 'Feijoada completa com arroz, couve e farofa (500g)', price: 25.00 },
        ]
      },
      {
        name: 'Marmitas Fitness',
        products: [
          { name: 'Fit Frango', description: 'Arroz integral, legumes e frango grelhado (400g)', price: 22.00 },
          { name: 'Fit Carne', description: 'Batata doce, brócolis e patinho grelhado (400g)', price: 25.00 },
          { name: 'Fit Salmão', description: 'Arroz integral, legumes e salmão grelhado (400g)', price: 35.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Refrigerante Lata', description: '350ml', price: 5.00 },
          { name: 'Suco Natural', description: 'Laranja ou limão - 300ml', price: 6.00 },
          { name: 'Água Mineral', description: '500ml', price: 3.00 },
        ]
      }
    ]
  },
  lanchonete: {
    id: 'lanchonete',
    name: 'Lanchonete',
    icon: '🥪',
    description: 'Lanches, salgados e bebidas',
    categories: [
      {
        name: 'Lanches Naturais',
        products: [
          { name: 'Natural de Frango', description: 'Pão integral, frango desfiado, cenoura, milho e maionese', price: 12.00 },
          { name: 'Natural de Atum', description: 'Pão integral, atum, milho, ervilha e maionese', price: 14.00 },
          { name: 'Natural Vegetariano', description: 'Pão integral, queijo, alface, tomate e cenoura', price: 10.00 },
        ]
      },
      {
        name: 'Salgados',
        products: [
          { name: 'Coxinha', description: 'Coxinha de frango com catupiry', price: 6.00 },
          { name: 'Esfiha de Carne', description: 'Esfiha aberta de carne', price: 5.00 },
          { name: 'Empada de Frango', description: 'Empada recheada de frango', price: 6.00 },
          { name: 'Quibe', description: 'Quibe frito', price: 5.00 },
          { name: 'Pão de Queijo', description: 'Porção com 5 unidades', price: 8.00 },
        ]
      },
      {
        name: 'Bebidas',
        products: [
          { name: 'Café Expresso', description: '50ml', price: 4.00 },
          { name: 'Cappuccino', description: '200ml', price: 7.00 },
          { name: 'Suco Natural', description: 'Laranja, limão ou maracujá - 300ml', price: 7.00 },
          { name: 'Refrigerante Lata', description: '350ml', price: 5.00 },
        ]
      },
      {
        name: 'Doces',
        products: [
          { name: 'Bolo de Cenoura', description: 'Fatia com cobertura de chocolate', price: 8.00 },
          { name: 'Torta de Limão', description: 'Fatia', price: 10.00 },
          { name: 'Brigadeiro', description: 'Unidade', price: 3.00 },
        ]
      }
    ]
  }
};

export function getMenuTemplate(nicheId: string): MenuTemplate | null {
  return MENU_TEMPLATES[nicheId] || null;
}

export function getAllMenuTemplates(): MenuTemplate[] {
  return Object.values(MENU_TEMPLATES);
}
