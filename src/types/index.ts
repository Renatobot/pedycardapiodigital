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

export interface SelectedProductOption {
  groupId: string;
  groupName: string;
  groupType?: 'single' | 'multiple' | 'flavor';
  priceRule?: 'highest' | 'average' | 'sum';
  hasAutoPricing?: boolean; // Flag to indicate if establishment has Pro+ (automatic pricing)
  options: { id: string; name: string; price: number }[];
}

// Utility function to calculate price based on group type and price rule
// If priceRule is null/undefined (no Pro+), always sum prices (manual pricing)
// If hasAutoPricing is explicitly false, also sum prices
export function calculateGroupPrice(group: SelectedProductOption): number {
  if (!group.options || group.options.length === 0) return 0;
  
  const prices = group.options.map(o => o.price);
  
  // If it's a flavor type AND has a valid price rule AND automatic pricing is not disabled
  // Then apply the price rule. Otherwise, sum normally.
  if (group.groupType === 'flavor' && group.priceRule && group.hasAutoPricing !== false) {
    switch (group.priceRule) {
      case 'highest':
        return Math.max(...prices);
      case 'average':
        return prices.reduce((a, b) => a + b, 0) / prices.length;
      case 'sum':
        return prices.reduce((a, b) => a + b, 0);
    }
  }
  
  // For other types OR if no price rule (no Pro+), sum normally
  return prices.reduce((a, b) => a + b, 0);
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedAdditions: ProductAddition[];
  selectedOptions: SelectedProductOption[];
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

// Admin é gerenciado via Supabase Auth + tabela user_roles
// Não armazenamos senhas no frontend
export interface Admin {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

// Tipos de role do sistema
export type AppRole = 'admin' | 'moderator' | 'user';
