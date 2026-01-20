import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  whatsapp: string;
  name: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  reference_point?: string;
}

const STORAGE_KEY = 'pedy-customer';

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on init
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCustomer(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  // Login by WhatsApp
  const login = useCallback(async (whatsapp: string): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    const normalizedPhone = normalizePhone(whatsapp);
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('whatsapp', normalizedPhone)
      .maybeSingle();

    if (error) {
      return { success: false, error: 'Erro ao buscar cadastro' };
    }

    if (data) {
      const customerData: Customer = {
        id: data.id,
        whatsapp: data.whatsapp,
        name: data.name,
        street: data.street || undefined,
        number: data.number || undefined,
        complement: data.complement || undefined,
        neighborhood: data.neighborhood || undefined,
        reference_point: data.reference_point || undefined,
      };
      setCustomer(customerData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
      return { success: true, customer: customerData };
    }
    
    return { success: false, error: 'Cadastro não encontrado. Verifique o número ou crie um novo cadastro.' };
  }, []);

  // Register new customer
  const register = useCallback(async (data: Omit<Customer, 'id'>): Promise<{ success: boolean; customer?: Customer; error?: string }> => {
    const normalizedPhone = normalizePhone(data.whatsapp);
    
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        whatsapp: normalizedPhone,
        name: data.name,
        street: data.street || null,
        number: data.number || null,
        complement: data.complement || null,
        neighborhood: data.neighborhood || null,
        reference_point: data.reference_point || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return { success: false, error: 'Este WhatsApp já está cadastrado. Tente fazer login.' };
      }
      return { success: false, error: 'Erro ao criar cadastro' };
    }

    if (newCustomer) {
      const customerData: Customer = {
        id: newCustomer.id,
        whatsapp: newCustomer.whatsapp,
        name: newCustomer.name,
        street: newCustomer.street || undefined,
        number: newCustomer.number || undefined,
        complement: newCustomer.complement || undefined,
        neighborhood: newCustomer.neighborhood || undefined,
        reference_point: newCustomer.reference_point || undefined,
      };
      setCustomer(customerData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
      return { success: true, customer: customerData };
    }
    
    return { success: false, error: 'Erro desconhecido' };
  }, []);

  // Update customer data
  const updateCustomer = useCallback(async (updates: Partial<Omit<Customer, 'id' | 'whatsapp'>>): Promise<{ success: boolean; error?: string }> => {
    if (!customer) {
      return { success: false, error: 'Nenhum cliente logado' };
    }

    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customer.id);

    if (error) {
      return { success: false, error: 'Erro ao atualizar cadastro' };
    }

    const updatedCustomer = { ...customer, ...updates };
    setCustomer(updatedCustomer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomer));
    return { success: true };
  }, [customer]);

  // Logout
  const logout = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    customer,
    loading,
    login,
    register,
    updateCustomer,
    logout,
    isLoggedIn: !!customer,
  };
}
