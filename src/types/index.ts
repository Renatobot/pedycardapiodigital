// Types for PEDY SaaS

export interface Establishment {
  id: string;
  name: string;
  logo?: string;
  cpfCnpj: string;
  whatsapp: string;
  email: string;
  pixKey?: string;
  trialStartDate: Date;
  trialEndDate: Date;
  planStatus: 'trial' | 'active' | 'expired';
  planExpiresAt?: Date;
  createdAt: Date;
}

export interface Category {
  id: string;
  establishmentId: string;
  name: string;
  order: number;
}

export interface ProductAddition {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  establishmentId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  additions: ProductAddition[];
  available: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAdditions: ProductAddition[];
  observations?: string;
}

export interface Order {
  id: string;
  establishmentId: string;
  items: CartItem[];
  customerAddress: string;
  referencePoint: string;
  paymentMethod: 'cash' | 'card-credit' | 'card-debit' | 'pix';
  needsChange?: boolean;
  changeFor?: number;
  pixPaidInAdvance?: boolean;
  status: 'pending' | 'preparing' | 'on-the-way' | 'delivered';
  total: number;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  role: 'establishment' | 'admin';
  establishmentId?: string;
}
