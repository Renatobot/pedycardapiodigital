// Feature-Gating System for Plan Tiers

// Preços dos planos
export const PLAN_PRICES = {
  BASIC: 37,
  PRO: 59.90,
  PRO_PLUS: 79.90,
} as const;

// Recursos disponíveis em TODOS os planos (incluindo Básico)
export const BASE_FEATURES = {
  PAYMENT_CENTER: 'payment_center',
  WHATSAPP_TEMPLATES: 'whatsapp_templates',
} as const;

export type BaseFeature = typeof BASE_FEATURES[keyof typeof BASE_FEATURES];

// Recursos exclusivos do Plano Pro (não disponíveis no Básico)
export const PRO_FEATURES = {
  DASHBOARD: 'dashboard',
  PUSH_NOTIFICATIONS: 'push_notifications',
  COUPONS: 'coupons',
  DELIVERY_ZONES: 'delivery_zones',
  BUSINESS_HOURS_CONFIG: 'business_hours_config',
  APPEARANCE_SETTINGS: 'appearance_settings',
  ORDER_HISTORY: 'order_history',
  // Novos recursos Pro
  BASIC_METRICS: 'basic_metrics',
  SCHEDULING_WHEN_OPEN: 'scheduling_when_open',
  ORDER_SEARCH_FILTER: 'order_search_filter',
  ORDER_PRINTING: 'order_printing',
} as const;

export type ProFeature = typeof PRO_FEATURES[keyof typeof PRO_FEATURES];

// Recursos exclusivos do Plano Pro+
export const PRO_PLUS_FEATURES = {
  PIZZA_3_4_FLAVORS: 'pizza_3_4_flavors',
  AUTOMATIC_PIZZA_PRICING: 'automatic_pizza_pricing', // Precificação automática (pelo mais caro, média, etc.)
  DYNAMIC_SELECTION_LIMITS: 'dynamic_selection_limits',
  ADVANCED_PRICING: 'advanced_pricing',
  COMPLEX_COMBOS: 'complex_combos',
  OPTION_DEPENDENCIES: 'option_dependencies',
  PRODUCT_CUSTOMIZATION: 'product_customization',
  // Novos recursos Pro+
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CRM: 'crm',
  AUTOMATIC_PROMOTIONS: 'automatic_promotions',
  DATA_EXPORT: 'data_export',
  DUPLICATE_PRODUCT: 'duplicate_product',
} as const;

export type ProPlusFeature = typeof PRO_PLUS_FEATURES[keyof typeof PRO_PLUS_FEATURES];

export interface FeatureAccess {
  hasAccess: boolean;
  reason: 'trial' | 'basic' | 'pro' | 'pro_plus' | 'locked';
}

export interface EstablishmentForGating {
  plan_status: string;
  plan_type?: string | null;
  trial_end_date?: string | null;
  has_pro_plus?: boolean;
}

/**
 * Check if an establishment has access to a Pro feature.
 * During trial, ALL features are unlocked.
 * Basic plan = only base features (cardápio + WhatsApp)
 * Pro plan = base + pro features
 * Pro+ plan = everything
 */
export function checkProFeatureAccess(
  establishment: EstablishmentForGating | null,
  feature: ProFeature
): FeatureAccess {
  if (!establishment) {
    return { hasAccess: false, reason: 'locked' };
  }

  const now = new Date();
  
  // During trial, ALL features are unlocked
  if (establishment.plan_status === 'trial') {
    const trialEnd = establishment.trial_end_date 
      ? new Date(establishment.trial_end_date) 
      : null;
    if (!trialEnd || trialEnd > now) {
      return { hasAccess: true, reason: 'trial' };
    }
  }
  
  // Check plan type
  const planType = establishment.plan_type || 'basic';
  
  if (planType === 'pro' || planType === 'pro_plus') {
    return { hasAccess: true, reason: planType as 'pro' | 'pro_plus' };
  }
  
  // Basic plan doesn't have Pro features
  return { hasAccess: false, reason: 'locked' };
}

/**
 * Check if an establishment has access to a Pro+ feature.
 * During trial, ALL features are unlocked.
 * After trial, Pro+ features require plan_type = 'pro_plus' or has_pro_plus = true.
 */
export function checkFeatureAccess(
  establishment: EstablishmentForGating | null,
  feature: ProPlusFeature
): FeatureAccess {
  if (!establishment) {
    return { hasAccess: false, reason: 'locked' };
  }

  const now = new Date();
  
  // During trial, ALL features are unlocked
  if (establishment.plan_status === 'trial') {
    const trialEnd = establishment.trial_end_date 
      ? new Date(establishment.trial_end_date) 
      : null;
    if (!trialEnd || trialEnd > now) {
      return { hasAccess: true, reason: 'trial' };
    }
  }
  
  // Check plan type or legacy has_pro_plus flag
  const planType = establishment.plan_type || 'basic';
  
  if (planType === 'pro_plus' || establishment.has_pro_plus) {
    return { hasAccess: true, reason: 'pro_plus' };
  }
  
  // Otherwise, feature is locked
  return { hasAccess: false, reason: 'locked' };
}

/**
 * Check if max_flavors value requires Pro+ (more than 2 flavors)
 */
export function requiresProPlusForFlavors(maxFlavors: number): boolean {
  return maxFlavors > 2;
}

// Labels in Portuguese for Base features
export const BASE_FEATURE_LABELS: Record<BaseFeature, string> = {
  payment_center: 'Central de Pagamentos',
  whatsapp_templates: 'Templates de Resposta WhatsApp',
};

// Labels in Portuguese for Pro features
export const PRO_FEATURE_LABELS: Record<ProFeature, string> = {
  dashboard: 'Painel de pedidos',
  push_notifications: 'Notificações Push',
  coupons: 'Cupons de desconto',
  delivery_zones: 'Taxas por bairro',
  business_hours_config: 'Configuração de horários',
  appearance_settings: 'Personalização de aparência',
  order_history: 'Histórico de pedidos',
  basic_metrics: 'Métricas básicas',
  scheduling_when_open: 'Agendamento com loja aberta',
  order_search_filter: 'Busca e filtro de pedidos',
  order_printing: 'Impressão de pedidos',
};

// Labels in Portuguese for Pro+ features
export const FEATURE_LABELS: Record<ProPlusFeature, string> = {
  pizza_3_4_flavors: 'Pizza com 3 ou 4 sabores',
  automatic_pizza_pricing: 'Precificação automática de pizza',
  dynamic_selection_limits: 'Limites de seleção dinâmicos',
  advanced_pricing: 'Precificação avançada',
  complex_combos: 'Combos complexos (açaí, etc.)',
  option_dependencies: 'Dependências entre opções',
  product_customization: 'Personalização avançada de produtos',
  advanced_analytics: 'Dashboard analítico avançado',
  crm: 'CRM - Gestão de clientes',
  automatic_promotions: 'Promoções automáticas',
  data_export: 'Exportação de dados',
  duplicate_product: 'Duplicar produto',
};

// Descriptions for Pro+ features
export const FEATURE_DESCRIPTIONS: Record<ProPlusFeature, string> = {
  pizza_3_4_flavors: 'Permite que seus clientes escolham até 4 sabores por pizza',
  automatic_pizza_pricing: 'Sistema cobra automaticamente pelo sabor mais caro, média ou soma',
  dynamic_selection_limits: 'Configure limites de seleção baseados em outras escolhas',
  advanced_pricing: 'Regras avançadas de precificação como "cobrar pelo maior valor"',
  complex_combos: 'Monte combos complexos com itens grátis e pagos',
  option_dependencies: 'Mostre opções baseadas em seleções anteriores',
  product_customization: 'Configure grupos de opções personalizáveis para seus produtos',
  advanced_analytics: 'Gráficos detalhados de faturamento, tendências e produtos mais vendidos',
  crm: 'Gerencie clientes, histórico de pedidos e identifique clientes VIP',
  automatic_promotions: 'Configure Happy Hour, desconto primeira compra e mais',
  data_export: 'Exporte pedidos, clientes e produtos para CSV/Excel',
  duplicate_product: 'Duplique produtos rapidamente com todos os adicionais',
};

/**
 * Generate WhatsApp message for Pro upgrade inquiry
 */
export function generateProUpgradeMessage(): string {
  return 'Olá! Quero fazer upgrade para o Plano Pro (R$ 59,90/mês).';
}

/**
 * Generate WhatsApp message for Pro+ upgrade inquiry
 */
export function generateProPlusUpgradeMessage(featureName?: string): string {
  return 'Olá! Quero fazer upgrade para o Plano Pro+ (R$ 79,90/mês).';
}
