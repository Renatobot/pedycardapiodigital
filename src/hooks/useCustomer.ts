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

function mapCustomer(data: any): Customer {
  return {
    id: data.id,
    whatsapp: data.whatsapp,
    name: data.name,
    street: data.street || undefined,
    number: data.number || undefined,
    complement: data.complement || undefined,
    neighborhood: data.neighborhood || undefined,
    reference_point: data.reference_point || undefined,
  };
}

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = useCallback(async (whatsapp: string) => {
    const normalizedPhone = normalizePhone(whatsapp);
    const { data, error } = await (supabase as any).rpc('customer_login', { _whatsapp: normalizedPhone });
    if (error) return { success: false, error: 'Erro ao buscar cadastro' };
    if (data && data.length > 0) {
      const customerData = mapCustomer(data[0]);
      setCustomer(customerData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
      return { success: true, customer: customerData };
    }
    return { success: false, error: 'Cadastro não encontrado. Verifique o número ou crie um novo cadastro.' };
  }, []);

  const register = useCallback(async (data: Omit<Customer, 'id'>) => {
    const normalizedPhone = normalizePhone(data.whatsapp);
    const { data: result, error } = await (supabase as any).rpc('customer_register', {
      _whatsapp: normalizedPhone,
      _name: data.name,
      _street: data.street || null,
      _number: data.number || null,
      _complement: data.complement || null,
      _neighborhood: data.neighborhood || null,
      _reference_point: data.reference_point || null,
    });
    if (error) {
      if (error.code === '23505') return { success: false, error: 'Este WhatsApp já está cadastrado. Tente fazer login.' };
      return { success: false, error: 'Erro ao criar cadastro' };
    }
    if (result && result.length > 0) {
      const customerData = mapCustomer(result[0]);
      setCustomer(customerData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customerData));
      return { success: true, customer: customerData };
    }
    return { success: false, error: 'Erro desconhecido' };
  }, []);

  const updateCustomer = useCallback(async (updates: Partial<Omit<Customer, 'id' | 'whatsapp'>>) => {
    if (!customer) return { success: false, error: 'Nenhum cliente logado' };
    const { error } = await (supabase as any).rpc('customer_update', {
      _id: customer.id,
      _whatsapp: customer.whatsapp,
      _name: updates.name ?? null,
      _street: updates.street ?? null,
      _number: updates.number ?? null,
      _complement: updates.complement ?? null,
      _neighborhood: updates.neighborhood ?? null,
      _reference_point: updates.reference_point ?? null,
    });
    if (error) return { success: false, error: 'Erro ao atualizar cadastro' };
    const updatedCustomer = { ...customer, ...updates };
    setCustomer(updatedCustomer);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomer));
    return { success: true };
  }, [customer]);

  const getAddresses = useCallback(async (): Promise<CustomerAddress[]> => {
    if (!customer) return [];
    const { data, error } = await (supabase as any).rpc('get_customer_addresses', {
      _customer_id: customer.id,
      _whatsapp: customer.whatsapp,
    });
    if (error || !data) return [];
    return data.map((addr: any) => ({
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

  const addAddress = useCallback(async (address: Omit<CustomerAddress, 'id' | 'is_default'> & { is_default?: boolean }) => {
    if (!customer) return { success: false, error: 'Nenhum cliente logado' };
    const { data, error } = await (supabase as any).rpc('add_customer_address', {
      _customer_id: customer.id,
      _whatsapp: customer.whatsapp,
      _label: address.label,
      _street: address.street,
      _number: address.number,
      _complement: address.complement || null,
      _neighborhood: address.neighborhood || null,
      _reference_point: address.reference_point || null,
      _is_default: address.is_default || false,
    });
    if (error || !data) return { success: false, error: 'Erro ao adicionar endereço' };
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

  const updateAddress = useCallback(async (addressId: string, updates: Partial<Omit<CustomerAddress, 'id'>>) => {
    if (!customer) return { success: false, error: 'Nenhum cliente logado' };
    const { error } = await (supabase as any).rpc('update_customer_address', {
      _address_id: addressId,
      _customer_id: customer.id,
      _whatsapp: customer.whatsapp,
      _label: updates.label ?? null,
      _street: updates.street ?? null,
      _number: updates.number ?? null,
      _complement: updates.complement ?? null,
      _neighborhood: updates.neighborhood ?? null,
      _reference_point: updates.reference_point ?? null,
      _is_default: updates.is_default ?? null,
    });
    if (error) return { success: false, error: 'Erro ao atualizar endereço' };
    return { success: true };
  }, [customer]);

  const deleteAddress = useCallback(async (addressId: string) => {
    if (!customer) return { success: false, error: 'Nenhum cliente logado' };
    const { error } = await (supabase as any).rpc('delete_customer_address', {
      _address_id: addressId,
      _customer_id: customer.id,
      _whatsapp: customer.whatsapp,
    });
    if (error) return { success: false, error: 'Erro ao remover endereço' };
    return { success: true };
  }, [customer]);

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
