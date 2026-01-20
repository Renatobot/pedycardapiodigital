import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EstablishmentReferral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referred_name: string | null;
  plan_type: string;
  plan_value: number;
  credit_status: 'pending' | 'applied' | 'expired';
  credit_applied_at: string | null;
  activated_at: string | null;
  created_at: string;
}

interface EstablishmentReferralData {
  own_referral_code: string | null;
  referral_credit: number;
  referrals: EstablishmentReferral[];
}

export function useEstablishmentReferrals(establishmentId: string | null) {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCredit, setReferralCredit] = useState(0);
  const [referrals, setReferrals] = useState<EstablishmentReferral[]>([]);

  const fetchReferralData = useCallback(async () => {
    if (!establishmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch establishment referral info
      const { data: establishment, error: estError } = await supabase
        .from('establishments')
        .select('own_referral_code, referral_credit')
        .eq('id', establishmentId)
        .single();

      if (estError) throw estError;

      setReferralCode(establishment?.own_referral_code || null);
      setReferralCredit(establishment?.referral_credit || 0);

      // Fetch referrals made by this establishment
      const { data: referralsData, error: refError } = await supabase
        .from('establishment_referrals')
        .select('*')
        .eq('referrer_id', establishmentId)
        .order('created_at', { ascending: false });

      if (refError) throw refError;

      setReferrals((referralsData || []) as EstablishmentReferral[]);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const getReferralLink = useCallback(() => {
    if (!referralCode) return '';
    return `${window.location.origin}/cadastro?indicacao=${referralCode}`;
  }, [referralCode]);

  const getWhatsAppShareMessage = useCallback((establishmentName: string) => {
    const link = getReferralLink();
    return encodeURIComponent(
      `🚀 Quer ter seu próprio cardápio digital como o meu?\n\n` +
      `Use o PEDY! É super fácil e prático.\n` +
      `Cadastre-se por este link especial:\n${link}\n\n` +
      `- ${establishmentName}`
    );
  }, [getReferralLink]);

  const getPendingCredit = useCallback(() => {
    return referrals
      .filter(r => r.credit_status === 'pending')
      .reduce((acc, r) => acc + r.plan_value, 0);
  }, [referrals]);

  const getAppliedCredit = useCallback(() => {
    return referrals
      .filter(r => r.credit_status === 'applied')
      .reduce((acc, r) => acc + r.plan_value, 0);
  }, [referrals]);

  const getSuccessfulReferralsCount = useCallback(() => {
    return referrals.length;
  }, [referrals]);

  return {
    loading,
    referralCode,
    referralCredit,
    referrals,
    getReferralLink,
    getWhatsAppShareMessage,
    getPendingCredit,
    getAppliedCredit,
    getSuccessfulReferralsCount,
    refetch: fetchReferralData,
  };
}
