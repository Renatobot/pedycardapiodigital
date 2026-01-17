import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '')    // Remove caracteres especiais
    .replace(/\s+/g, '-')            // Espaços viram hífens
    .replace(/-+/g, '-')             // Remove hífens duplicados
    .replace(/^-|-$/g, '')           // Remove hífens no início/fim
    .trim();
}

export function isEstablishmentActive(establishment: {
  plan_status: string;
  trial_end_date?: string;
  plan_expires_at?: string | null;
}): { active: boolean; reason: 'trial_expired' | 'plan_expired' | null } {
  const now = new Date();
  
  if (establishment.plan_status === 'active') {
    if (establishment.plan_expires_at && new Date(establishment.plan_expires_at) <= now) {
      return { active: false, reason: 'plan_expired' };
    }
    return { active: true, reason: null };
  }
  
  if (establishment.plan_status === 'trial') {
    if (establishment.trial_end_date && new Date(establishment.trial_end_date) <= now) {
      return { active: false, reason: 'trial_expired' };
    }
    return { active: true, reason: null };
  }
  
  // Status 'expired' or any other = blocked
  return { active: false, reason: 'plan_expired' };
}
