import { Category, Product, Establishment } from '@/types';

export const mockEstablishment: Establishment = {
  id: '1',
  name: 'Lanchonete do João',
  cpfCnpj: '12.345.678/0001-99',
  whatsapp: '11999999999',
  email: 'joao@lanchonete.com',
  pixKey: 'joao@lanchonete.com',
  trialStartDate: new Date(),
  trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  planStatus: 'trial',
  createdAt: new Date(),
};

export const mockCategories: Category[] = [
  { id: '1', establishmentId: '1', name: 'Lanches', order: 1 },
  { id: '2', establishmentId: '1', name: 'Bebidas', order: 2 },
  { id: '3', establishmentId: '1', name: 'Porções', order: 3 },
  { id: '4', establishmentId: '1', name: 'Sobremesas', order: 4 },
];

export const mockProducts: Product[] = [
  {
    id: '1',
    categoryId: '1',
    establishmentId: '1',
    name: 'X-Burguer',
    description: 'Pão, hambúrguer artesanal 180g, queijo, alface, tomate e molho especial',
    price: 22.90,
    available: true,
    additions: [
      { id: 'a1', name: 'Bacon', price: 5.00 },
      { id: 'a2', name: 'Ovo', price: 3.00 },
      { id: 'a3', name: 'Queijo extra', price: 4.00 },
    ],
  },
  {
    id: '2',
    categoryId: '1',
    establishmentId: '1',
    name: 'X-Salada',
    description: 'Pão, hambúrguer 150g, queijo, alface, tomate, cebola e maionese',
    price: 18.90,
    available: true,
    additions: [
      { id: 'a1', name: 'Bacon', price: 5.00 },
      { id: 'a2', name: 'Ovo', price: 3.00 },
    ],
  },
  {
    id: '3',
    categoryId: '1',
    establishmentId: '1',
    name: 'X-Bacon',
    description: 'Pão, hambúrguer 180g, queijo, bacon crocante e molho barbecue',
    price: 26.90,
    available: true,
    additions: [
      { id: 'a3', name: 'Queijo extra', price: 4.00 },
      { id: 'a4', name: 'Cebola caramelizada', price: 4.50 },
    ],
  },
  {
    id: '4',
    categoryId: '2',
    establishmentId: '1',
    name: 'Refrigerante Lata',
    description: 'Coca-Cola, Guaraná ou Fanta (350ml)',
    price: 6.00,
    available: true,
    additions: [],
  },
  {
    id: '5',
    categoryId: '2',
    establishmentId: '1',
    name: 'Suco Natural',
    description: 'Laranja, limão ou maracujá (400ml)',
    price: 9.00,
    available: true,
    additions: [
      { id: 'a5', name: 'Açúcar extra', price: 0 },
    ],
  },
  {
    id: '6',
    categoryId: '3',
    establishmentId: '1',
    name: 'Batata Frita',
    description: 'Porção de batata frita crocante (300g)',
    price: 18.00,
    available: true,
    additions: [
      { id: 'a6', name: 'Cheddar', price: 5.00 },
      { id: 'a7', name: 'Bacon', price: 5.00 },
    ],
  },
  {
    id: '7',
    categoryId: '4',
    establishmentId: '1',
    name: 'Brownie com Sorvete',
    description: 'Brownie de chocolate com bola de sorvete de creme',
    price: 16.00,
    available: true,
    additions: [
      { id: 'a8', name: 'Calda de chocolate', price: 3.00 },
    ],
  },
];
