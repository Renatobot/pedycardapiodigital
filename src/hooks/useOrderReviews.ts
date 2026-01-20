import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderReview {
  id: string;
  order_id: string;
  customer_id: string | null;
  establishment_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export function useOrderReviews(establishmentId?: string) {
  const [reviews, setReviews] = useState<OrderReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    if (!establishmentId) return;

    setLoading(true);
    try {
      // Fetch reviews with customer info via order
      const { data, error } = await supabase
        .from('order_reviews' as any)
        .select(`
          *,
          orders!inner(customer_name)
        `)
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsWithNames = (data || []).map((review: any) => ({
        id: review.id,
        order_id: review.order_id,
        customer_id: review.customer_id,
        establishment_id: review.establishment_id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at,
        customer_name: review.orders?.customer_name || 'Cliente anônimo',
      }));

      setReviews(reviewsWithNames);

      // Calculate stats
      if (reviewsWithNames.length > 0) {
        const total = reviewsWithNames.length;
        const sum = reviewsWithNames.reduce((acc: number, r: OrderReview) => acc + r.rating, 0);
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        reviewsWithNames.forEach((r: OrderReview) => {
          distribution[r.rating as keyof typeof distribution]++;
        });

        setStats({
          averageRating: sum / total,
          totalReviews: total,
          ratingDistribution: distribution,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const submitReview = useCallback(async (
    orderId: string,
    establishmentId: string,
    rating: number,
    comment?: string,
    customerId?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('order_reviews' as any)
        .insert({
          order_id: orderId,
          establishment_id: establishmentId,
          rating,
          comment: comment || null,
          customer_id: customerId || null,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Avaliação já enviada',
            description: 'Você já avaliou este pedido.',
            variant: 'destructive',
          });
        } else {
          throw error;
        }
        return false;
      }

      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado pelo seu feedback.',
      });

      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const checkOrderReviewed = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('order_reviews' as any)
        .select('id')
        .eq('order_id', orderId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking review:', error);
      return false;
    }
  }, []);

  return {
    reviews,
    loading,
    stats,
    fetchReviews,
    submitReview,
    checkOrderReviewed,
  };
}
