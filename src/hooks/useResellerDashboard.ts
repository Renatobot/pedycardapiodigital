import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ResellerClient {
  id: string;
  name: string;
  whatsapp: string;
  plan_status: string;
  plan_type: string | null;
  plan_expires_at: string | null;
  trial_end_date: string;
  created_at: string;
  activated_by_reseller: boolean | null;
}

export interface ResellerData {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  pricing_mode: string;
  referral_code: string;
  commission_percentage: number;
  price_basic: number;
  price_pro: number;
  price_pro_plus: number;
  total_establishments: number;
  active_establishments: number;
  total_activations: number;
  is_active: boolean;
  created_at: string;
}

export interface ResellerCommission {
  id: string;
  establishment_name: string;
  plan_type: string;
  plan_price: number;
  commission_value: number;
  commission_status: string;
  activated_at: string;
  days_activated: number;
}

export interface ResellerStats {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  pendingCommission: number;
  paidCommission: number;
  thisMonthActivations: number;
  thisMonthCommission: number;
}

export function useResellerDashboard() {
  const [reseller, setReseller] = useState<ResellerData | null>(null);
  const [clients, setClients] = useState<ResellerClient[]>([]);
  const [commissions, setCommissions] = useState<ResellerCommission[]>([]);
  const [stats, setStats] = useState<ResellerStats>({
    totalClients: 0,
    activeClients: 0,
    inactiveClients: 0,
    pendingCommission: 0,
    paidCommission: 0,
    thisMonthActivations: 0,
    thisMonthCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResellerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      // Fetch reseller info
      const { data: resellerData, error: resellerError } = await supabase
        .from('resellers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (resellerError || !resellerData) {
        setError('Você não é um revendedor registrado');
        return;
      }

      setReseller(resellerData);

      // Fetch clients (only allowed fields via view)
      const { data: clientsData, error: clientsError } = await supabase
        .from('reseller_establishments_view')
        .select('*')
        .eq('reseller_id', resellerData.id);

      if (clientsError) {
        console.error('Error fetching clients:', clientsError);
      } else {
        setClients(clientsData || []);
      }

      // Fetch commissions (if commission mode)
      if (resellerData.pricing_mode === 'commission') {
        const { data: commissionsData, error: commissionsError } = await supabase
          .from('reseller_activations')
          .select('*')
          .eq('reseller_id', resellerData.id)
          .order('activated_at', { ascending: false });

        if (commissionsError) {
          console.error('Error fetching commissions:', commissionsError);
        } else {
          setCommissions(commissionsData || []);
        }
      }

      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const activeClients = (clientsData || []).filter(c => {
        if (c.plan_status === 'active') {
          return !c.plan_expires_at || new Date(c.plan_expires_at) > now;
        }
        if (c.plan_status === 'trial') {
          return new Date(c.trial_end_date) > now;
        }
        return false;
      });

      const pendingCommissions = (commissions || []).filter(c => c.commission_status === 'pending');
      const paidCommissions = (commissions || []).filter(c => c.commission_status === 'paid');
      const thisMonthCommissions = (commissions || []).filter(c => 
        new Date(c.activated_at) >= monthStart
      );

      setStats({
        totalClients: (clientsData || []).length,
        activeClients: activeClients.length,
        inactiveClients: (clientsData || []).length - activeClients.length,
        pendingCommission: pendingCommissions.reduce((sum, c) => sum + c.commission_value, 0),
        paidCommission: paidCommissions.reduce((sum, c) => sum + c.commission_value, 0),
        thisMonthActivations: thisMonthCommissions.length,
        thisMonthCommission: thisMonthCommissions.reduce((sum, c) => sum + c.commission_value, 0),
      });

    } catch (err) {
      console.error('Error fetching reseller data:', err);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResellerData();
  }, [fetchResellerData]);

  const getReferralLink = useCallback(() => {
    if (!reseller) return '';
    
    const baseUrl = window.location.origin;
    
    // Commission mode: direct to registration
    if (reseller.pricing_mode === 'commission') {
      return `${baseUrl}/cadastro?ref=${reseller.referral_code}`;
    }
    
    // Custom price mode: to landing page (WhatsApp will be reseller's)
    return `${baseUrl}/?ref=${reseller.referral_code}`;
  }, [reseller]);

  const getClientStatus = useCallback((client: ResellerClient) => {
    const now = new Date();
    
    if (client.plan_status === 'active') {
      if (!client.plan_expires_at || new Date(client.plan_expires_at) > now) {
        return { status: 'active', label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      }
      return { status: 'expired', label: 'Expirado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    }
    
    if (client.plan_status === 'trial') {
      if (new Date(client.trial_end_date) > now) {
        return { status: 'trial', label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      }
      return { status: 'expired', label: 'Trial Expirado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
    }
    
    return { status: 'expired', label: 'Expirado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
  }, []);

  const getDaysRemaining = useCallback((client: ResellerClient) => {
    const now = new Date();
    let expirationDate: Date | null = null;
    
    if (client.plan_status === 'active' && client.plan_expires_at) {
      expirationDate = new Date(client.plan_expires_at);
    } else if (client.plan_status === 'trial') {
      expirationDate = new Date(client.trial_end_date);
    }
    
    if (!expirationDate) return null;
    
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, []);

  return {
    reseller,
    clients,
    commissions,
    stats,
    loading,
    error,
    fetchResellerData,
    getReferralLink,
    getClientStatus,
    getDaysRemaining,
  };
}
