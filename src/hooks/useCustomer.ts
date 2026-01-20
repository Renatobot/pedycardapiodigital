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

export interface CustomerAddress {
  id: string;
  label: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood?: string | null;
  reference_point?: string | null;
  is_default: boolean;
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

  // Get customer addresses
  const getAddresses = useCallback(async (): Promise<CustomerAddress[]> => {
    if (!customer) return [];

    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }

    return data.map(addr => ({
      id: addr.id,
      label: addr.label || 'Casa',
      street: addr.street,
      number: addr.number,
      complement: addr.complement,
      neighborhood: addr.neighborhood,
      reference_point: addr.reference_point,
      is_default: addr.is_default || false,
    }));
  }, [customer]);

  // Add new address
  const addAddress = useCallback(async (address: Omit<CustomerAddress, 'id' | 'is_default'> & { is_default?: boolean }): Promise<{ success: boolean; address?: CustomerAddress; error?: string }> => {
    if (!customer) {
      return { success: false, error: 'Nenhum cliente logado' };
    }

    // If this is set as default, unset other defaults first
    if (address.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customer.id);
    }

    const { data, error } = await supabase
      .from('customer_addresses')
      .insert({
        customer_id: customer.id,
        label: address.label,
        street: address.street,
        number: address.number,
        complement: address.complement || null,
        neighborhood: address.neighborhood || null,
        reference_point: address.reference_point || null,
        is_default: address.is_default || false,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: 'Erro ao adicionar endereço' };
    }

    return {
      success: true,
      address: {
        id: data.id,
        label: data.label || 'Casa',
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        reference_point: data.reference_point,
        is_default: data.is_default || false,
      },
    };
  }, [customer]);

  // Update address
  const updateAddress = useCallback(async (addressId: string, updates: Partial<Omit<CustomerAddress, 'id'>>): Promise<{ success: boolean; error?: string }> => {
    if (!customer) {
      return { success: false, error: 'Nenhum cliente logado' };
    }

    // If setting as default, unset other defaults first
    if (updates.is_default) {
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customer.id);
    }

    const { error } = await supabase
      .from('customer_addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('customer_id', customer.id);

    if (error) {
      return { success: false, error: 'Erro ao atualizar endereço' };
    }

    return { success: true };
  }, [customer]);

  // Delete address
  const deleteAddress = useCallback(async (addressId: string): Promise<{ success: boolean; error?: string }> => {
    if (!customer) {
      return { success: false, error: 'Nenhum cliente logado' };
    }

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId)
      .eq('customer_id', customer.id);

    if (error) {
      return { success: false, error: 'Erro ao remover endereço' };
    }

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
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    logout,
    isLoggedIn: !!customer,
  };
}
