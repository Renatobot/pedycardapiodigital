import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

export interface CustomerOrderItem {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  selectedAdditions: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  selectedOptions: Array<{
    groupId: string;
    groupName: string;
    options: Array<{
      id: string;
      name: string;
      price: number;
    }>;
  }>;
  observations?: string;
}

export interface CustomerOrder {
  id: string;
  items: CustomerOrderItem[];
  total: number;
  subtotal: number;
  delivery_fee: number | null;
  status: string;
  created_at: string;
  delivery_type: string | null;
  neighborhood: string | null;
  customer_address: string;
  payment_method: string;
}

export function useCustomerOrders(customerId?: string, establishmentId?: string) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    if (!customerId || !establishmentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('establishment_id', establishmentId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      if (data) {
        setOrders(data.map(order => ({
          id: order.id,
          items: order.items as unknown as CustomerOrderItem[],
          total: order.total,
          subtotal: order.subtotal,
          delivery_fee: order.delivery_fee,
          status: order.status || 'pending',
          created_at: order.created_at || '',
          delivery_type: order.delivery_type,
          neighborhood: order.neighborhood,
          customer_address: order.customer_address,
          payment_method: order.payment_method,
        })));
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId, establishmentId]);

  const repeatOrder = useCallback(async (order: CustomerOrder) => {
    if (!order.items || order.items.length === 0) {
      toast({
        title: 'Erro',
        description: 'Este pedido não possui itens válidos.',
        variant: 'destructive',
      });
      return false;
    }

    let addedCount = 0;

    for (const item of order.items) {
      try {
        // Verify product still exists
        const { data: product } = await supabase
          .from('products')
          .select('id, name, price, available, image_url, description, category_id, establishment_id')
          .eq('id', item.product.id)
          .single();

        if (!product || !product.available) {
          toast({
            title: 'Produto indisponível',
            description: `${item.product.name} não está mais disponível.`,
            variant: 'destructive',
          });
          continue;
        }

        // Add to cart with original additions and options
        addItem(
          {
            id: product.id,
            name: product.name,
            price: product.price,
            available: product.available,
            image: product.image_url || undefined,
            description: product.description || undefined,
            categoryId: product.category_id,
            establishmentId: product.establishment_id,
            additions: [],
          },
          item.quantity,
          item.selectedAdditions.map(a => ({
            id: a.id,
            name: a.name,
            price: a.price,
            productId: product.id,
          })),
          item.observations,
          item.selectedOptions.map(g => ({
            groupId: g.groupId,
            groupName: g.groupName,
            options: g.options.map(o => ({
              id: o.id,
              name: o.name,
              price: o.price,
            })),
          }))
        );
        addedCount++;
      } catch (err) {
        console.error('Error adding item:', err);
      }
    }

    if (addedCount > 0) {
      toast({
        title: '🔄 Pedido adicionado!',
        description: `${addedCount} item(s) adicionado(s) ao carrinho.`,
      });
      return true;
    }

    return false;
  }, [addItem, toast]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendente', color: 'text-yellow-600' },
      confirmed: { label: 'Confirmado', color: 'text-blue-600' },
      preparing: { label: 'Em preparo', color: 'text-orange-600' },
      delivering: { label: 'A caminho', color: 'text-purple-600' },
      completed: { label: 'Entregue', color: 'text-green-600' },
      cancelled: { label: 'Cancelado', color: 'text-red-600' },
    };
    return labels[status] || { label: status, color: 'text-muted-foreground' };
  };

  return {
    orders,
    loading,
    fetchOrders,
    repeatOrder,
    getStatusLabel,
  };
}
