import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reseller {
  id: string;
  user_id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  access_type: 'all' | 'own_only';
  is_master: boolean;
  is_active: boolean;
  pricing_mode: 'custom_price' | 'commission';
  price_basic: number;
  price_pro: number;
  price_pro_plus: number;
  commission_percentage: number;
  referral_code: string;
  total_establishments: number;
  active_establishments: number;
  total_activations: number;
  last_login_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerActivation {
  id: string;
  reseller_id: string;
  establishment_id: string;
  establishment_name: string | null;
  plan_type: string;
  plan_price: number;
  days_activated: number;
  commission_percentage: number;
  commission_value: number;
  commission_status: 'pending' | 'paid' | 'cancelled';
  commission_paid_at: string | null;
  activated_at: string;
  created_at: string;
}

export interface ResellerStats {
  reseller: Reseller;
  establishments: any[];
  activations: ResellerActivation[];
  pendingCommission: number;
  paidCommission: number;
  totalCommission: number;
  thisMonthActivations: number;
  thisMonthCommission: number;
}

export interface CreateResellerData {
  name: string;
  email: string;
  password: string;
  whatsapp?: string;
  access_type: 'all' | 'own_only';
  pricing_mode: 'custom_price' | 'commission';
  price_basic?: number;
  price_pro?: number;
  price_pro_plus?: number;
  commission_percentage?: number;
}

export const useResellers = () => {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchResellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin', {
        body: { action: 'list_resellers' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResellers(data?.resellers || []);
    } catch (err: any) {
      console.error('Error fetching resellers:', err);
      setError(err.message);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os revendedores.',
        variant: 'destructive',
      });
    }
    setLoading(false);
  }, [toast]);

  const createReseller = useCallback(async (data: CreateResellerData) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'create_reseller',
          ...data,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast({
        title: 'Sucesso!',
        description: `Revendedor ${data.name} criado com sucesso.`,
      });

      await fetchResellers();
      return result;
    } catch (err: any) {
      console.error('Error creating reseller:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Não foi possível criar o revendedor.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchResellers]);

  const updateReseller = useCallback(async (resellerId: string, updates: Partial<Reseller>) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'update_reseller',
          reseller_id: resellerId,
          ...updates,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast({
        title: 'Sucesso!',
        description: 'Revendedor atualizado com sucesso.',
      });

      await fetchResellers();
      return result;
    } catch (err: any) {
      console.error('Error updating reseller:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Não foi possível atualizar o revendedor.',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast, fetchResellers]);

  const getResellerStats = useCallback(async (resellerId: string): Promise<ResellerStats | null> => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'get_reseller_stats',
          reseller_id: resellerId,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (err: any) {
      console.error('Error getting reseller stats:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas do revendedor.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const markCommissionPaid = useCallback(async (activationIds: string[]) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'mark_commission_paid',
          activation_ids: activationIds,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      toast({
        title: 'Sucesso!',
        description: 'Comissões marcadas como pagas.',
      });

      return result;
    } catch (err: any) {
      console.error('Error marking commission paid:', err);
      toast({
        title: 'Erro',
        description: err.message || 'Não foi possível marcar as comissões como pagas.',
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast]);

  const registerActivation = useCallback(async (
    establishmentId: string, 
    planType: string, 
    planPrice: number, 
    days: number
  ) => {
    try {
      const { data: result, error } = await supabase.functions.invoke('create-admin', {
        body: { 
          action: 'register_activation',
          establishment_id: establishmentId,
          plan_type: planType,
          plan_price: planPrice,
          days: days,
        },
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      if (result?.commission_registered) {
        toast({
          title: 'Comissão registrada',
          description: `Comissão de R$ ${result.commission_value.toFixed(2)} registrada para ${result.reseller_name}.`,
        });
      }

      return result;
    } catch (err: any) {
      console.error('Error registering activation:', err);
      // Don't show toast for this - it's a background operation
      return null;
    }
  }, [toast]);

  const toggleResellerStatus = useCallback(async (resellerId: string, isActive: boolean) => {
    return updateReseller(resellerId, { is_active: isActive });
  }, [updateReseller]);

  return {
    resellers,
    loading,
    error,
    fetchResellers,
    createReseller,
    updateReseller,
    getResellerStats,
    markCommissionPaid,
    registerActivation,
    toggleResellerStatus,
  };
};
