// Feature-Gating System for Pro+ Features

export const PRO_PLUS_FEATURES = {
  PIZZA_3_4_FLAVORS: 'pizza_3_4_flavors',
  DYNAMIC_SELECTION_LIMITS: 'dynamic_selection_limits',
  ADVANCED_PRICING: 'advanced_pricing',
  COMPLEX_COMBOS: 'complex_combos',
  OPTION_DEPENDENCIES: 'option_dependencies',
} as const;

export type ProPlusFeature = typeof PRO_PLUS_FEATURES[keyof typeof PRO_PLUS_FEATURES];

export interface FeatureAccess {
  hasAccess: boolean;
  reason: 'trial' | 'pro_plus' | 'locked';
}

export interface EstablishmentForGating {
  plan_status: string;
  trial_end_date?: string | null;
  has_pro_plus?: boolean;
}

/**
 * Check if an establishment has access to a Pro+ feature.
 * During trial, ALL features are unlocked.
 * After trial, Pro+ features require has_pro_plus = true.
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
  
  // If has Pro+, advanced features are unlocked
  if (establishment.has_pro_plus) {
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

// Labels in Portuguese for each feature
export const FEATURE_LABELS: Record<ProPlusFeature, string> = {
  pizza_3_4_flavors: 'Pizza com 3 ou 4 sabores',
  dynamic_selection_limits: 'Limites de seleção dinâmicos',
  advanced_pricing: 'Precificação avançada',
  complex_combos: 'Combos complexos (açaí, etc.)',
  option_dependencies: 'Dependências entre opções',
};

// Descriptions for Pro+ features
export const FEATURE_DESCRIPTIONS: Record<ProPlusFeature, string> = {
  pizza_3_4_flavors: 'Permite que seus clientes escolham até 4 sabores por pizza',
  dynamic_selection_limits: 'Configure limites de seleção baseados em outras escolhas',
  advanced_pricing: 'Regras avançadas de precificação como "cobrar pelo maior valor"',
  complex_combos: 'Monte combos complexos com itens grátis e pagos',
  option_dependencies: 'Mostre opções baseadas em seleções anteriores',
};

/**
 * Generate WhatsApp message for Pro+ upgrade inquiry
 */
export function generateProPlusUpgradeMessage(featureName?: string): string {
  if (featureName) {
    return `Olá! Tenho interesse em ativar os Recursos Avançados (Pro+) do PEDY para usar: ${featureName}. Podem me ajudar?`;
  }
  return 'Olá! Gostaria de saber mais sobre os Recursos Avançados (Pro+) do PEDY. Podem me explicar?';
}
